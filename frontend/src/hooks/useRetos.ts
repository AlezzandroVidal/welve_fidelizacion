import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { retosApi, CreateRetoDto } from "../api/retos";

export function useRetos() {
  return useQuery({
    queryKey: ["retos", "list"],
    queryFn: () => retosApi.list().then((r) => r.data),
  });
}

export function useCreateReto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRetoDto) => retosApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["retos", "list"] }),
  });
}
