import { useQuery } from "@tanstack/react-query"
import { Finances } from "@/services"

export function useFinances() {
  return useQuery({
    queryKey: ["finances"],
    queryFn: () => Finances.getFinances(),
  })
}
