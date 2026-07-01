export const TextCropper = (value: string, limit?: number): string => {
  if (!limit) {
    limit = value.length;
  }

  var canBeCropped = false;
  if (value?.length > limit) {
    canBeCropped = true;
  }

  var newValue: string;
  if (canBeCropped) {
    newValue = value?.substring(0, limit - 3) + "...";
  } else {
    newValue = value;
  }

  return newValue;
};
