export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { success: false });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return jsonResponse(500, { success: false });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, { success: false });
  }

  const password = String(body.password || "");
  return jsonResponse(200, {
    success: Boolean(password) && password === adminPassword,
  });
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}
