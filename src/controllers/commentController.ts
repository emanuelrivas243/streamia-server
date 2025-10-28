/**
 * @file commentController.ts
 * @description Controlador para gestionar los comentarios de películas.
 */

import { Request, Response } from "express";
import Comment from "../models/Comment";

/**
 * Create a new comment
 * @async
 * @function createComment
 * @route POST /api/comments
 * @access Private
 * @param {Request} req - Express request object, expects `movieId` and `text` in body
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with created comment
 * @throws {Error} If validation or database operation fails
 */
export const createComment = async (req: Request, res: Response) => {
  try {
    const { movieId, text } = req.body;
    const userId = (req as any).userId; // se obtiene del token JWT

    if (!text || !movieId) {
      return res.status(400).json({ message: "Faltan campos requeridos" });
    }

    const comment = await Comment.create({ userId, movieId, text });
    res.status(201).json(comment);
  } catch (error) {
    console.error("❌ Error al crear el comentario:", error);
    res.status(500).json({
      message: "Error al crear el comentario",
      error: error instanceof Error ? error.message : error,
    });
  }
};

/**
 * Get all comments for a specific movie
 * @async
 * @function getCommentsByMovie
 * @route GET /api/comments/:movieId
 * @access Public
 * @param {Request} req - Express request object, expects `movieId` in params
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON array of comments for the movie
 * @throws {Error} If query or database operation fails
 */
export const getCommentsByMovie = async (req: Request, res: Response) => {
  try {
    const { movieId } = req.params;
    const comments = await Comment.find({ movieId })
      .populate("userId", "firstName lastName email") // muestra info básica del usuario
      .sort({ createdAt: -1 });

    res.status(200).json(comments);
  } catch (error) {
    console.error("❌ Error al obtener comentarios:", error);
    res.status(500).json({
      message: "Error al obtener comentarios",
      error: error instanceof Error ? error.message : error,
    });
  }
};

/**
 * Update a comment (only allowed for the comment’s owner)
 * @async
 * @function updateComment
 * @route PUT /api/comments/:id
 * @access Private
 * @param {Request} req - Express request object, expects `id` param and `text` in body
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with updated comment
 * @throws {Error} If comment not found or user not authorized
 */
export const updateComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = (req as any).userId; 

    const comment = await Comment.findOneAndUpdate(
      { _id: id, userId },
      { text, updatedAt: new Date() },
      { new: true }
    );

    if (!comment) {
      return res.status(404).json({
        message: "Comentario no encontrado o no autorizado",
      });
    }

    res.status(200).json(comment);
  } catch (error) {
    console.error("❌ Error al actualizar comentario:", error);
    res.status(500).json({
      message: "Error al actualizar comentario",
      error: error instanceof Error ? error.message : error,
    });
  }
};

/**
 * Delete a comment (only allowed for the comment’s owner)
 * @async
 * @function deleteComment
 * @route DELETE /api/comments/:id
 * @access Private
 * @param {Request} req - Express request object, expects `id` param
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with success message
 * @throws {Error} If comment not found or user not authorized
 */
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId; 

    const comment = await Comment.findOneAndDelete({ _id: id, userId });

    if (!comment) {
      return res.status(404).json({
        message: "Comentario no encontrado o no autorizado",
      });
    }

    res.status(200).json({ message: "Comentario eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar comentario:", error);
    res.status(500).json({
      message: "Error al eliminar comentario",
      error: error instanceof Error ? error.message : error,
    });
  }
};

/**
 * Get all comments for a movie (extended version)
 * @async
 * @function getCommentsByMovieId
 * @route GET /api/comments/movie/:movieId
 * @access Public
 * @param {Request} req - Express request object, expects `movieId` in params
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with movie comments
 * @throws {Error} If no comments found or database operation fails
 */
export const getCommentsByMovieId = async (req: Request, res: Response) => {
  try {
    const { movieId } = req.params;

    const comments = await Comment.find({ movieId })
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 });

    if (!comments || comments.length === 0) {
      return res
        .status(404)
        .json({ message: "No hay comentarios para esta película." });
    }

    res.status(200).json(comments);
  } catch (error) {
    console.error("❌ Error al obtener los comentarios:", error);
    res.status(500).json({
      message: "Error al obtener comentarios",
      error: error instanceof Error ? error.message : error,
    });
  }
};
