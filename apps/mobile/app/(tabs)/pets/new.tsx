import { PetForm } from "@/components/pets/PetForm";
import { useCreatePet } from "@/hooks/usePets";
import type { CreatePetInput } from "@vetconnect/shared/validators/pets";

export default function NewPetScreen() {
  const createMutation = useCreatePet();

  function handleSubmit(data: CreatePetInput) {
    createMutation.mutate(data);
  }

  return (
    <PetForm
      onSubmit={handleSubmit}
      isLoading={createMutation.isPending}
      submitLabel="Add Pet"
    />
  );
}
