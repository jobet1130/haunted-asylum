import { useQuery, useMutation } from "@tanstack/react-query";
import { gameApi } from "@/lib/api";
import type { Player } from "@/types";

export function usePlayer(playerId: string) {
  return useQuery({
    queryKey: ["player", playerId],
    queryFn: async () => {
      const response = await gameApi.player.get(playerId);
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch player");
      }
      return response.data;
    },
    enabled: !!playerId,
  });
}

export function useCreatePlayer() {
  return useMutation({
    mutationFn: async (playerData: Partial<Player>) => {
      const response = await gameApi.player.create(playerData);
      if (!response.success) {
        throw new Error(response.error || "Failed to create player");
      }
      return response.data;
    },
  });
}
