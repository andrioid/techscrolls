import { ENV, HANDLE_RESOLVER_URL, PLC_DIRECTORY_URL } from "../constants";
import { AuthPage } from "./auth-page";
import { AuthProvider } from "./auth-provider";

const clientId = `http://localhost?${new URLSearchParams({
  scope: "atproto transition:generic",
  redirect_uri: Object.assign(new URL(window.location.origin), {
    hostname: "127.0.0.1",
    search: new URLSearchParams({
      env: ENV,
      handle_resolver: HANDLE_RESOLVER_URL,
      ...(PLC_DIRECTORY_URL && { plc_directory_url: PLC_DIRECTORY_URL }),
    }).toString(),
  }).href,
})}`;

export function AuthRoot() {
  return (
    <AuthProvider
      clientId={clientId}
      plcDirectoryUrl={PLC_DIRECTORY_URL}
      handleResolver={HANDLE_RESOLVER_URL}
      allowHttp={ENV === "development" || ENV === "test"}
    >
      <AuthPage />
    </AuthProvider>
  );
}
