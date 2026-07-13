export default {
  failed: 'Action failed',
  success: 'Action was successful',

  auth: {
    register: 'Register',
    login: 'Authorization',
    logout: 'Logout',
    alreadyHaveAccount: 'Already have an account?',
    loginDescription: 'Login and registration',
  },

  menu: {
    header: 'Menu',
    map: {
      title: 'Map',
      caption: 'Actual Map',
    },
    chat: {
      title: 'Chat',
      caption: 'Personal Chat',
    },
  },

  settings: {
    title: 'Settings',
    theme: {
      title: 'Theme',
      auto: 'Auto',
      light: 'Light',
      dark: 'Dark',
    },
    language: {
      title: 'Language',
    },
    glassEffect: {
      title: 'Glass mode',
    },
  },

  // --- Additions for UI components ---
  form: {
    email: 'Email',
    password: {
      title: 'Password',
      error: 'Required field',
    },
    repeatPassword: {
      title: 'Repeat password',
      error: 'Required field',
      mismatchError: 'Passwords do not match',
    },
    username: {
      title: 'Username',
      error: 'Required field',
    },
    phone: 'Phone',
  },

  buttons: {
    login: 'Login',
    createAccount: 'Create account',
  },

  validation: {
    required: 'This field is required',
    minLength: 'Minimum 6 characters',
    invalidEmail: 'Please enter a valid email address',
  },

  notify: {
    registrationSuccess: 'Registration successful!',

    // --- Errors for notifications ---
    errors: {
      // Generic errors
      unknown: 'An unexpected error occurred. Please try again.',
      network: 'Network error. Please check your internet connection and try again.',
      serverUnavailable: 'The server is temporarily unavailable. Please try again later.',

      // API Client Errors (4xx)
      badRequest: 'Bad request. Please check the data you entered.', // 400
      unauthorized: 'Incorrect login or password.', // 401
      forbidden: 'You do not have permission to perform this action.', // 403
      notFound: 'The requested resource was not found.', // 404
      conflict: 'An entry with this data already exists.', // 409
      validation: 'Please check the validity of the data you entered.', // 422
      tooManyRequests: 'Too many requests. Please wait a moment and try again.', // 429
    },
  },
}
