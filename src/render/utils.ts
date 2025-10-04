export const calculateRMS = (array: string | any[] | Uint8Array<any>) => {
  let sum = 0;
  for (let i = 0; i < array.length; ++i) {
    const normalized = array[i] / 128 - 1;
    sum += normalized * normalized;
  }
  return Math.sqrt(sum / array.length);
}


