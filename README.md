
---

## Auth Endpoints with JWT + Cookies

### 1. **Register**

* **POST** `/auth/register`
* **Body:**

```json
{
  "email": "john@example.com",
  "password": "StrongPassword123"
}
```

* **Response:**

```http
Set-Cookie: refreshToken=jwt_refresh_token_here; HttpOnly; Secure; SameSite=Strict; Path=/auth/refresh
```
```json
{
  "message": "User registered successfully"
}
```

---

### 2. **Login**

* **POST** `/auth/login`
* **Body:**

```json
{
  "email": "john@example.com",
  "password": "StrongPassword123"
}
```

* **Response (JSON + Cookie):**

```json
{
  "accessToken": "jwt_access_token_here",
  "expiresIn": 900
}
```

* **Cookies set:**

```http
Set-Cookie: refreshToken=jwt_refresh_token_here; HttpOnly; Secure; SameSite=Strict; Path=/auth/refresh
```

---

### 3. **Refresh Token**

* **POST** `/auth/refresh`
* **Cookies Sent Automatically:** `refreshToken=jwt_refresh_token_here`
* **Response:**

```json
{
  "accessToken": "new_jwt_access_token_here",
  "expiresIn": 900
}
```

---

### 4. **Change Password** (must be logged in)

* **POST** `/auth/change-password`
* **Headers:**
  `Authorization: Bearer <accessToken>`
* **Body:**

```json
{
  "oldPassword": "OldPassword123",
  "newPassword": "NewStrongPassword456"
}
```

* **Response:**

```json
{
  "message": "Password changed successfully"
}
```

---

### 5. **Forgot Password**

* **POST** `/auth/forgot-password`
* **Body:**

```json
{
  "email": "john@example.com"
}
```

* **Response (don’t leak info):**

```json
{
  "message": "If an account exists, a reset link has been sent."
}
```

---

### 6. **Reset Password**

* **POST** `/auth/reset-password`
* **Body:**

```json
{
  "resetToken": "token_from_email_link",
  "newPassword": "NewPassword123"
}
```

* **Response:**

```json
{
  "message": "Password has been reset successfully"
}
```

---

### 7. **Logout**

* **POST** `/auth/logout`
* **Action:** Clear the `refreshToken` cookie.
* **Response:**

```json
{
  "message": "Logged out successfully"
}
```

---

## ⚡ Key Rules

* **Access token** → returned in JSON, short-lived (`5–15 min`).
* **Refresh token** → stored in `HttpOnly` cookie, long-lived (`7–30 days`).
* **Logout** → clear cookie.
* **Refresh** → only works if the cookie is valid and present.

---