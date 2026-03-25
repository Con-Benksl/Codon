export const resolveBinding = (data: Record<string, any>, binding?: string) => {
  if (!binding) return data;
  if (!binding.startsWith('$.')) return undefined;

  return binding
    .slice(2)
    .split('.')
    .filter(Boolean)
    .reduce<any>((current, key) => {
      if (current == null) return undefined;
      return current[key];
    }, data);
};
