import { Router } from "express";
import {
    addFavorite,
    getFavoritesByUser,
    removeFavorite,
} from "../controllers/favoritesController";

const router = Router();

/**
 * Favorites Routes
 * Base path: /api/favorites
 * Example endpoints:
 *   GET    /api/favorites/:userId      -> Get all favorites of a user
 *   POST   /api/favorites              -> Add new favorite
 *   DELETE /api/favorites/:userId/:contentId -> Remove favorite
 */

// Obtener todos los favoritos de un usuario
router.get("/:userId", getFavoritesByUser);

// Agregar un nuevo favorito
router.post("/", addFavorite);

// Eliminar un favorito específico
router.delete("/:userId/:contentId", removeFavorite);

export default router;
