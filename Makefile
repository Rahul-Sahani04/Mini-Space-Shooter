.PHONY: install dev build preview clean lint format test

# Default target
all: install build

# Install dependencies
install:
	npm install

# Start development server
dev:
	npm run dev

# Build for production
build:
	npm run build

# Preview production build
preview:
	npm run preview

# Clean build artifacts
clean:
	rm -rf dist
	rm -rf node_modules

# Lint code
lint:
	npm run lint

# Format code
format:
	npm run format

# Run tests
test:
	npm run test

# Development setup
setup: install
	git config core.ignorecase true
	npm run format
	npm run lint

# Create new component (usage: make component name=ComponentName)
component:
	mkdir -p src/components/$(name)
	touch src/components/$(name)/$(name).js
	touch src/components/$(name)/$(name).css

# Help
help:
	@echo "Available commands:"
	@echo "  make install    - Install dependencies"
	@echo "  make dev        - Start development server"
	@echo "  make build      - Build for production"
	@echo "  make preview    - Preview production build"
	@echo "  make clean      - Clean build artifacts"
	@echo "  make lint       - Lint code"
	@echo "  make format     - Format code"
	@echo "  make test       - Run tests"
	@echo "  make setup      - Initial development setup"
	@echo "  make component  - Create new component (usage: make component name=ComponentName)"