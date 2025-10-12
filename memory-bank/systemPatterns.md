# System Patterns & Architecture

## System Architecture

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Background    │    │   Content       │    │   Popup UI      │
│   Service       │◄──►│   Script        │◄──►│   (Settings)    │
│                 │    │                 │    │                 │
│ • Monitors      │    │ • Detects       │    │ • Key config    │
│   network       │    │   challenges    │    │ • Status        │
│ • Manages keys  │    │ • Handles auth  │    │   display       │
│ • Coordinates   │    │ • Injects       │    │                 │
│   auth flow     │    │   responses     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Responsibilities

#### Background Service
- **Network Monitoring**: Intercepts and analyzes HTTP requests/responses
- **Key Management**: Secure storage and retrieval of SSH key configurations
- **Authentication Coordination**: Orchestrates challenge-response cycles
- **State Management**: Maintains authentication session state

#### Content Script
- **Challenge Detection**: Identifies SSH authentication challenges in web pages
- **Response Injection**: Modifies DOM/forms to include decrypted responses
- **Event Handling**: Listens for authentication-related page events
- **Security Isolation**: Operates within page context without direct key access

#### Popup Interface
- **Configuration Management**: User interface for key path and settings
- **Status Reporting**: Displays current authentication state and errors
- **Permission Handling**: Manages extension permissions and access

## Key Technical Decisions

### Authentication Flow
```
Challenge Received → Key Retrieval → Decryption → Response Injection → Success/Failure
```

### Security Model
- **Key Isolation**: Private keys never leave background service context
- **Challenge-Response**: Only decrypts specific challenges, not general signing
- **No Key Export**: Keys remain in extension's secure storage
- **Permission-Based Access**: Granular permissions for file system access

### Data Flow Patterns
- **Event-Driven**: Authentication triggered by network events
- **Asynchronous**: Non-blocking operations for UI responsiveness
- **Stateful Sessions**: Maintains context across multiple requests

## Design Patterns

### Observer Pattern
- Background service observes network requests
- Content scripts observe DOM changes
- UI updates observe authentication state changes

### Strategy Pattern
- Multiple authentication methods (RSA, ECDSA, Ed25519)
- Different challenge formats supported
- Configurable key storage strategies

### Facade Pattern
- Simplified API for complex cryptographic operations
- Unified interface for different SSH key formats
- Abstracted browser extension APIs

## Component Relationships

### Coupling Strategy
- **Loose Coupling**: Components communicate via message passing
- **Single Responsibility**: Each component has focused functionality
- **Dependency Injection**: Configuration passed through secure channels

### Communication Patterns
- **Message Passing**: Chrome extension messaging API for inter-component comms
- **Event Broadcasting**: State changes broadcast to interested components
- **Request-Response**: Synchronous operations for immediate results

## Critical Implementation Paths

### Authentication Success Path
1. Network request intercepted with auth challenge
2. Challenge parsed and validated
3. Private key retrieved from secure storage
4. Challenge decrypted using SSH private key
5. Response formatted and injected into request
6. Authentication completes successfully

### Error Handling Path
1. Challenge detection fails → Log and continue
2. Key retrieval fails → Show configuration error
3. Decryption fails → Display auth failure
4. Injection fails → Fallback to manual auth

### Security Boundaries
- **Extension Sandbox**: Isolated from host page JavaScript
- **Key Containment**: Private keys never exposed to content scripts
- **Permission Scope**: Minimal required permissions for functionality
