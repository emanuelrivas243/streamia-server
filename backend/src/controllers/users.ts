import { Request, Response } from "express";
import usersDAO from "../dao/usersDao";

class UsersController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const user = await usersDAO.create(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ message: "Error al crear usuario", error });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const users = await usersDAO.getAll();
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener usuarios", error });
    }
  }

  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await usersDAO.getOne(id);

      if (!user) {
        res.status(404).json({ message: "Usuario no encontrado" });
        return;
      }

      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener usuario", error });
    }
  } 

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updatedUser = await usersDAO.updateById(id, req.body);

      if (!updatedUser) {
        res.status(404).json({ message: "Usuario no encontrado" });
        return;
      }

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Error al actualizar usuario", error });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deletedUser = await usersDAO.deleteById(id);

      if (!deletedUser) {
        res.status(404).json({ message: "Usuario no encontrado" });
        return;
      }

      res.status(200).json({ message: "Usuario eliminado correctamente" });
    } catch (error) {
      res.status(500).json({ message: "Error al eliminar usuario", error });
    }
  }
}

export default new UsersController();
