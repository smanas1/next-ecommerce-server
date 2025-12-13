import { prisma } from "../server";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

function generateToken(userId: string, email: string, role: string) {
  const accessToken = jwt.sign(
    {
      userId,
      email,
      role,
    },
    process.env.JWT_SECRET!,
    { expiresIn: "3d" }
  );
  const refreshToken = uuidv4();
  return { accessToken, refreshToken };
}

async function setTokens(
  res: Response,
  accessToken: string,
  refreshToken: string
) {
  const isProduction = process.env.NODE_ENV === "production";

  // In development, use lax sameSite for localhost
  // In production, use none with secure for cross-site requests
  const cookieConfig = isProduction
    ? {
        httpOnly: true,
        secure: true,
        sameSite: "lax" as const,
        maxAge: 60 * 60 * 10000,
      }
    : {
        httpOnly: true,
        secure: false,
        sameSite: "lax" as const,
        maxAge: 60 * 60 * 10000,
      };

  const refreshTokenOptions = {
    ...cookieConfig,
    maxAge: 7 * 24 * 60 * 60 * 10000,
  };

  res.cookie("accessToken", accessToken, cookieConfig);
  res.cookie("refreshToken", refreshToken, refreshTokenOptions);
  res.cookie("refreshToken", refreshToken, refreshTokenOptions);
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: "User with this email exists!",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "USER",
      },
    });

    res.status(201).json({
      message: "User registered successfully",
      success: true,
      userId: user.id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Registration failed" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const extractCurrentUser = await prisma.user.findUnique({
      where: { email },
    });

    if (
      !extractCurrentUser ||
      !(await bcrypt.compare(password, extractCurrentUser.password))
    ) {
      res.status(401).json({
        success: false,
        error: "Invalied credentials",
      });

      return;
    }
    //create our access and refreshtoken
    const { accessToken, refreshToken } = generateToken(
      extractCurrentUser.id,
      extractCurrentUser.email,
      extractCurrentUser.role
    );

    // Save refresh token to database
    await prisma.user.update({
      where: { id: extractCurrentUser.id },
      data: { refreshToken: refreshToken },
    });

    //set out tokens
    await setTokens(res, accessToken, refreshToken);
    res.status(200).json({
      success: true,
      message: "Login successfully",
      user: {
        id: extractCurrentUser.id,
        name: extractCurrentUser.name,
        email: extractCurrentUser.email,
        role: extractCurrentUser.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed" });
  }
};

export const refreshAccessToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    res.status(401).json({
      success: false,
      error: "Invalid refresh token",
    });
    return;
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        refreshToken: refreshToken,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    const { accessToken, refreshToken: newRefreshToken } = generateToken(
      user.id,
      user.email,
      user.role
    );

    // Update user with new refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    // Set new tokens in cookies
    await setTokens(res, accessToken, newRefreshToken);

    res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "Refresh token error",
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies.refreshToken;

  // Clear refresh token from database if it exists
  if (refreshToken) {
    try {
      await prisma.user.updateMany({
        where: { refreshToken: refreshToken },
        data: { refreshToken: null },
      });
    } catch (error) {
      console.error("Error clearing refresh token:", error);
    }
  }

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({
    success: true,
    message: "User logged out successfully",
  });
};

export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = (req as any).user; // Assuming middleware adds user info
    const { name, email } = req.body;

    // Check if another user already has this email
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email, NOT: { id: userId } }, // Exclude current user
      });

      if (existingUser) {
        res.status(400).json({
          success: false,
          error: "Email already in use by another user",
        });
        return;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      error: "Profile update failed",
    });
  }
};

export const getProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = (req as any).user; // Assuming middleware adds user info

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch profile",
    });
  }
};
