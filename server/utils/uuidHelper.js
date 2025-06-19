// UUID formatting helper function
export const formatAsUUID = (id) => {
  if (!id) return null;
  
  // Check if id is already in UUID format
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(id.toString())) {
    return id.toString();
  }
  
  // Convert simple numeric IDs to UUID format
  // Using version 4 UUID format with a fixed prefix
  const paddedId = id.toString().padStart(4, '0');
  return `00000000-0000-4000-A000-00000000${paddedId}`;
};