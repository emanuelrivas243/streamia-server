import { Router } from "express";
import {
    addFavorite,
    getFavoritesByUser,
    removeFavorite,
    updateFavoriteNote
} from "../controllers/favoritesController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

/**
 * Favorites Routes
 * Base path: /api/favorites
 * Example endpoints:
 *   GET    /api/favorites/:userId           -> Get all favorites of a user
 *   POST   /api/favorites                   -> Add new favorite
 *   DELETE /api/favorites/:userId/:movieId  -> Remove favorite
 */

// Aplicar middleware de autenticación a todas las rutas de favoritos
router.use(authenticate);

// Obtener todos los favoritos del usuario autenticado (sin necesidad de userId en URL)
router.get("/", getFavoritesByUser);

// Agregar un nuevo favorito (userId ahora viene del token)
router.post("/", addFavorite);

// Nueva ruta: Actualizar nota de un favorito
router.put("/:id", updateFavoriteNote);

// Eliminar un favorito específico (solo movieId en URL, userId del token)
router.delete("/:movieId", removeFavorite);

export default router;