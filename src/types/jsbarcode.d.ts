declare module 'jsbarcode' {
  const JsBarcode: (
    elemento: Element | string,
    valor: string,
    opciones?: Record<string, unknown>,
  ) => void;
  export default JsBarcode;
}
