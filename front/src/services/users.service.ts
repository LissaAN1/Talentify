import { apiClient } from "@/services/api-client";
import { UpdateUserDto, User } from "@/interfaces/user";

class UsersService {
    async getMe(): Promise<User> {
        const response = await apiClient.get<User>("/users/me");
        return response.data;
    }

    async updateMe(updateUserDto: UpdateUserDto): Promise<User> {
        const response = await apiClient.put<User>("/users/me", updateUserDto);
        return response.data;
    }
}

export const usersService = new UsersService();
