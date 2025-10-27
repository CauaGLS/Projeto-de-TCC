"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Finances } from "@/services";

export function useFamily() {
  const queryClient = useQueryClient();

  const family = useQuery({
    queryKey: ["family"],
    queryFn: () => Finances.getFamily(),
  });

  const familyUsers = useQuery({
    queryKey: ["family-users"],
    queryFn: () => Finances.listFamilyUsers(),
    enabled: !!family.data,
  });

  const createFamily = useMutation({
    mutationFn: (data: { name: string }) =>
      Finances.createFamily({ requestBody: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family"] });
      queryClient.invalidateQueries({ queryKey: ["family-users"] });
    },
  });

  const joinFamily = useMutation({
    mutationFn: (data: { code: string }) =>
      Finances.joinFamily({ requestBody: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family"] });
      queryClient.invalidateQueries({ queryKey: ["family-users"] });
    },
  });

  const leaveFamily = useMutation({
    mutationFn: () => Finances.leaveFamily(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family"] });
      queryClient.invalidateQueries({ queryKey: ["family-users"] });
    },
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => Finances.removeFamilyMember({ userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family-users"] });
    },
  });

  return {
    family,
    familyUsers,
    createFamily,
    joinFamily,
    leaveFamily,
    removeMember,
  };
}
