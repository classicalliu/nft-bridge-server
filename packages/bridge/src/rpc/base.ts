import fetch from "cross-fetch";
import JSBI from "jsbi";

function mergeOptions(overrideOptions: any, defaultOptions: any) {
  defaultOptions = defaultOptions || {};
  const headers = Object.assign(
    {},
    defaultOptions.headers || {},
    overrideOptions.headers || {}
  );
  return Object.assign({}, defaultOptions, overrideOptions, {
    headers: headers,
  });
}

const batchHandler = {
  get: (target: any, method: any, receiver: any) => {
    if (method === "send") {
      return async () => {
        const response = await fetch(
          target.uri,
          mergeOptions(
            {
              method: "post",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(target.payload),
            },
            target.defaultOptions
          )
        );
        return await response.json();
      };
    }
    return (...params: any[]) => {
      const id = target.id;
      target.id = target.id + 1;
      target.payload.push({
        jsonrpc: "2.0",
        id: id,
        method: method,
        params: params,
      });
      return receiver;
    };
  },
};

const handler = {
  get: (target: any, method: any) => {
    if (method === "batch") {
      return () => {
        return new Proxy(
          {
            id: Math.round(Math.random() * 10000000),
            payload: [],
            uri: target.uri,
            defaultOptions: target.defaultOptions,
          },
          batchHandler
        );
      };
    }
    return async (...params: any[]) => {
      const id = Math.round(Math.random() * 10000000);
      const response = await fetch(
        target.uri,
        mergeOptions(
          {
            method: "post",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: id,
              method: method,
              params: params,
            }),
          },
          target.defaultOptions
        )
      );
      const data = await response.json();
      if (data.id !== id) {
        throw new Error("JSONRPCError: response ID does not match request ID!");
      }
      if (data.error) {
        throw new Error(
          `JSONRPCError: server error ${JSON.stringify(data.error)}`
        );
      }
      return data.result;
    };
  },
};

export class RPC {
  private uri: any;
  private defaultOptions: any;
  constructor(uri: any, defaultOptions: any = {}) {
    this.uri = uri;
    this.defaultOptions = defaultOptions;
    return new Proxy(this, handler);
  }

  static create(uri: any) {
    return new RPC(uri);
  }
}

export function HexStringToBigInt(hexString: string) {
  return JSBI.BigInt(hexString);
}

export function BigIntToHexString(bigInt: any) {
  return "0x" + bigInt.toString(16);
}
