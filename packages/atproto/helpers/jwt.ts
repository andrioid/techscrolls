interface DefaultDecodedPayload {
  iat: number;
  iss: string;
  aud: string;
  exp: number;
  lxm: string;
  jti: string;
}

export function decodeJWT<T extends object = DefaultDecodedPayload>(
  token: string
): T {
  const [_header, payload, _signature] = token.split(".");
  const decodedPayload = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(decodedPayload);
}

export function extractJWT(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return null;
  }

  const [type, token] = authHeader.split(" ");
  if (type !== "Bearer" || !token) {
    return null;
  }

  return token;
}

export function jwtFromRequest<T extends object = DefaultDecodedPayload>(
  req: Request
) {
  const jwt = extractJWT(req);
  if (!jwt) return;
  const data = decodeJWT<T>(jwt);
  return data;
}
