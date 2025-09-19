export function isValidKoreanPlate(plate: string): boolean {
  const regex = /^\d{2,3}[가-힣]\d{4}$/;
  return regex.test(plate);
}
