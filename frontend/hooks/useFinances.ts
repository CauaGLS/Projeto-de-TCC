import { useQuery } from "@tanstack/react-query"
import { Finances } from "@/services"

export function useFinances(userExists: boolean) {
  return useQuery({
    queryKey: ["finances"],
    queryFn: () => Finances.getFinances(),
    enabled: userExists,
  })
}
