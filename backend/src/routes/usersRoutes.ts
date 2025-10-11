import express from "express";
import usersController from "../controllers/users";

const router = express.Router();

router.post("/", usersController.create);

router.get("/", usersController.getAll);

router.get("/:id", usersController.getOne);

router.put("/:id", usersController.update);

router.delete("/:id", usersController.delete);

export default router;
