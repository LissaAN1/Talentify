import { apiClient } from "@/services/api-client";
import { CreateUserDto, UpdateUserDto, UpdateUserRolesDto, User } from "@/interfaces/user";

class UsersService {
    async getMe(): Promise<User> {
        const response = await apiClient.get<User>("/users/me");
        return response.data;
    }

    async updateMe(updateUserDto: UpdateUserDto): Promise<User> {
        const response = await apiClient.put<User>("/users/me", updateUserDto);
        return response.data;
    }

    async findAll(): Promise<User[]> {
        const response = await apiClient.get<User[]>("/users");
        return response.data;
    }

    async findOne(id: string): Promise<User> {
        const response = await apiClient.get<User>(`/users/${id}`);
        return response.data;
    }

    async create(createUserDto: CreateUserDto): Promise<User> {
        const response = await apiClient.post<User>("/users", createUserDto);
        return response.data;
    }

    async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        const response = await apiClient.put<User>(`/users/${id}`, updateUserDto);
        return response.data;
    }

    async updateRoles(id: string, updateUserRolesDto: UpdateUserRolesDto): Promise<User> {
        const response = await apiClient.patch<User>(`/users/${id}/roles`, updateUserRolesDto);
        return response.data;
    }

    async delete(id: string): Promise<User> {
        const response = await apiClient.delete<User>(`/users/${id}`);
        return response.data;
    }
}

export const usersService = new UsersService();
