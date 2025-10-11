import User, { IUser } from "../schemas/User";

class UsersDAO {
  async create(userData: Partial<IUser>): Promise<IUser> {
    const user = new User(userData);
    return user.save();
  }

  async getAll(): Promise<IUser[]> {
    return User.find();
  }

  async getOne(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
  }

  async updateById(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, updateData, { new: true });
  }

  async deleteById(id: string): Promise<IUser | null> {
    return User.findByIdAndDelete(id);
  }
}

export default new UsersDAO();
