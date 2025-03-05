# Contributing to Ollama GUI

Thank you for considering contributing to Ollama GUI! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue tracker to see if the problem has already been reported. When creating a bug report, please include as much detail as possible:

- **Use a clear and descriptive title**
- **Describe the steps to reproduce the problem**
- **Provide specific examples** to demonstrate the steps
- **Describe the expected behavior**
- **Include screenshots or animated GIFs** if possible
- **Include environment details** (OS, browser, version, etc.)

### Suggesting Features

Feature suggestions are tracked as GitHub issues. When creating a feature suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested feature**
- **Explain why this feature would be useful**
- **Provide examples of how it would be used**

### Pull Requests

- **Fill in the required pull request template**
- **Do not include issue numbers in the PR title**
- **Follow the coding style**
- **Include tests when adding features**
- **End all files with a newline**
- **Document new code**

## Development Setup

### Backend Development

1. Install dependencies:
   ```bash
   cd backend
   poetry install
   ```

2. Run the development server:
   ```bash
   poetry run uvicorn app.main:app --reload
   ```

3. Run tests:
   ```bash
   poetry run pytest
   ```

### Frontend Development

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Run tests:
   ```bash
   npm test
   ```

## Coding Style

### Python Style

- Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/) with a line length of 100 characters
- Use type hints wherever possible
- Organize imports: standard library, third-party, local
- Use docstrings for public modules, functions, classes, and methods

### JavaScript/TypeScript Style

- Use ESLint with the provided configuration
- Use TypeScript for type safety
- Prefer arrow functions for callbacks
- Use destructuring assignment where it makes the code clearer
- Avoid complex nesting

## Git Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Releasing

The maintainers will handle the release process.

## License

By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
