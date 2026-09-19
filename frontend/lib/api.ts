export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "/api";

type ApiOptions = RequestInit & {
  token?: string;
  skipAuthRedirect?: boolean;
};

type ApiError = Error & {
  status?: number;
  details?: unknown;
};

export async function apiFetch<T>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> {
  const { token, headers, body, skipAuthRedirect, ...rest } = options;

  const isFormData = body instanceof FormData;

  const response = await fetch(`${API_URL}${endpoint}`, {
    cache: "no-store",
    ...rest,
    body,
    headers: {
      ...(isFormData
        ? {}
        : {
            "Content-Type": "application/json",
          }),
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
      ...headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    if (
      !skipAuthRedirect &&
      (response.status === 401 || response.status === 403)
    ) {
      localStorage.removeItem("scm_token");
      localStorage.removeItem("scm_user");
      window.location.href = "/login";
    }

    const error: ApiError = new Error(data?.message || "Something went wrong");

    error.status = response.status;
    error.details = data;

    throw error;
  }

  return data;
}

export async function downloadAuthenticatedFile(
  endpoint: string,
  token: string,
): Promise<Blob> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      method: "GET",
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    throw new Error(
      "Unable to reach the server. Check that both the frontend and backend are running, then try again.",
      { cause: error },
    );
  }

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json().catch(() => null)
      : await response.text().catch(() => "");
    const message =
      typeof payload === "object" && payload && "message" in payload
        ? String(payload.message)
        : typeof payload === "string" && payload.trim()
          ? payload
          : `Download failed (${response.status}).`;

    throw new Error(message);
  }

  return response.blob();
}
