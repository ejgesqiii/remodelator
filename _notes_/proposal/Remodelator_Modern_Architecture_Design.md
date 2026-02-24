# Remodelator - Modern Architecture Design

## Technology Stack Overview

### Frontend
- **Vite** - Lightning-fast build tool and dev server
- **React 18** with **TypeScript** - Type-safe component architecture
- **React Router v6** - Client-side routing
- **TanStack Query** (React Query) - Server state management
- **Zustand** - Lightweight client state management
- **TailwindCSS** - Utility-first styling
- **Shadcn/ui** - Accessible component library
- **React Hook Form** + **Zod** - Type-safe form validation

### Backend
- **Python 3.11+**
- **FastAPI** - Modern async web framework
- **Pydantic v2** - Data validation and serialization
- **Firebase Admin SDK** - Firestore integration
- **Python-Jose** - JWT token handling
- **Passlib** - Password hashing
- **Uvicorn** - ASGI server

### Database & Cloud
- **Google Cloud Firestore** - Serverless NoSQL document database
- **Cloud Storage** - File/image storage
- **Cloud Functions** - Serverless background tasks (optional)
- **Cloud Run** - Containerized API hosting

### DevOps & Tools
- **Docker** - Containerization
- **GitHub Actions** - CI/CD
- **Poetry** - Python dependency management
- **ESLint + Prettier** - Code quality
- **Vitest** - Frontend testing
- **Pytest** - Backend testing

---

## Architecture Overview

### Modern 3-Tier Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                            │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │        Vite + React + TypeScript SPA               │    │
│  │                                                     │    │
│  │  • React Components (UI)                           │    │
│  │  • React Router (Navigation)                       │    │
│  │  • TanStack Query (Server State)                   │    │
│  │  • Zustand (Client State)                          │    │
│  │  • TailwindCSS + Shadcn (Styling)                  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│         ↕ HTTPS/REST API + WebSockets (optional)            │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   API/BACKEND LAYER                          │
│                    (Cloud Run Container)                     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              FastAPI Application                    │    │
│  │                                                     │    │
│  │  ├── /api/v1/auth      (Authentication)            │    │
│  │  ├── /api/v1/users     (User Management)           │    │
│  │  ├── /api/v1/estimates (Estimates/Orders)          │    │
│  │  ├── /api/v1/items     (Catalog Items)             │    │
│  │  ├── /api/v1/tree      (Hierarchy Navigation)      │    │
│  │  └── /api/v1/proposals (Customer Proposals)        │    │
│  │                                                     │    │
│  │  Middleware:                                        │    │
│  │  • JWT Authentication                               │    │
│  │  • CORS                                             │    │
│  │  • Rate Limiting                                    │    │
│  │  • Request Validation (Pydantic)                    │    │
│  │  • Error Handling                                   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                             │
│                 Google Cloud Firestore                       │
│                                                              │
│  Collections:                                                │
│  ├── users/               (User accounts)                    │
│  ├── contractors/         (Contractor profiles)              │
│  ├── estimates/           (Project estimates)                │
│  │   └── [estimateId]/                                      │
│  │       └── lineItems/   (Subcollection)                   │
│  ├── catalog/             (Item catalog)                     │
│  │   └── nodes/          (Tree hierarchy)                   │
│  ├── templates/           (Estimate templates)               │
│  └── audit_logs/          (Activity tracking)                │
│                                                              │
│  Features:                                                   │
│  • Real-time listeners                                       │
│  • Automatic scaling                                         │
│  • Security rules                                            │
│  • Compound queries                                          │
│  • Offline support (SDK)                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

### Frontend Structure (Vite + React + TypeScript)

```
frontend/
├── public/
│   └── assets/              # Static assets
├── src/
│   ├── api/                 # API client layer
│   │   ├── client.ts        # Axios/Fetch config
│   │   ├── auth.ts          # Auth endpoints
│   │   ├── estimates.ts     # Estimate endpoints
│   │   ├── items.ts         # Item catalog endpoints
│   │   └── tree.ts          # Tree navigation endpoints
│   │
│   ├── components/          # React components
│   │   ├── ui/              # Shadcn base components
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── tree.tsx
│   │   │   └── ...
│   │   ├── layout/          # Layout components
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── MainLayout.tsx
│   │   ├── estimates/       # Estimate-specific
│   │   │   ├── EstimateList.tsx
│   │   │   ├── EstimateForm.tsx
│   │   │   └── LineItemTable.tsx
│   │   ├── catalog/         # Catalog components
│   │   │   ├── ItemTree.tsx
│   │   │   ├── ItemCard.tsx
│   │   │   └── ItemSearch.tsx
│   │   └── common/          # Shared components
│   │       ├── Loading.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── ProtectedRoute.tsx
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useEstimates.ts
│   │   ├── useItems.ts
│   │   ├── useTree.ts
│   │   └── useDebounce.ts
│   │
│   ├── stores/              # Zustand state stores
│   │   ├── authStore.ts     # Auth state
│   │   ├── uiStore.ts       # UI state (modals, etc)
│   │   └── estimateStore.ts # Current estimate
│   │
│   ├── types/               # TypeScript types
│   │   ├── api.types.ts     # API response types
│   │   ├── models.types.ts  # Domain models
│   │   └── index.ts
│   │
│   ├── utils/               # Utility functions
│   │   ├── formatting.ts    # Number/date formatting
│   │   ├── validation.ts    # Input validation
│   │   └── constants.ts     # App constants
│   │
│   ├── pages/               # Route pages
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Estimates/
│   │   │   ├── EstimateList.tsx
│   │   │   ├── EstimateEditor.tsx
│   │   │   └── EstimateView.tsx
│   │   ├── Catalog/
│   │   │   ├── Bathroom.tsx
│   │   │   ├── Kitchen.tsx
│   │   │   └── Basement.tsx
│   │   └── Profile.tsx
│   │
│   ├── lib/                 # Third-party configs
│   │   ├── queryClient.ts   # React Query config
│   │   └── firebase.ts      # Firebase client config
│   │
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   └── vite-env.d.ts        # Vite types
│
├── .env.example             # Environment variables template
├── .eslintrc.cjs           # ESLint config
├── .prettierrc             # Prettier config
├── tailwind.config.js      # Tailwind config
├── tsconfig.json           # TypeScript config
├── vite.config.ts          # Vite config
└── package.json            # Dependencies
```

### Backend Structure (Python + FastAPI)

```
backend/
├── app/
│   ├── api/                 # API routes
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py      # Auth endpoints
│   │   │   ├── users.py     # User management
│   │   │   ├── estimates.py # Estimate CRUD
│   │   │   ├── items.py     # Item catalog
│   │   │   ├── tree.py      # Tree navigation
│   │   │   └── proposals.py # Customer proposals
│   │   └── deps.py          # Dependencies (auth, etc)
│   │
│   ├── core/                # Core functionality
│   │   ├── config.py        # Settings (from env)
│   │   ├── security.py      # JWT, password hashing
│   │   └── firebase.py      # Firestore client
│   │
│   ├── models/              # Pydantic models
│   │   ├── user.py          # User schemas
│   │   ├── estimate.py      # Estimate schemas
│   │   ├── item.py          # Item schemas
│   │   ├── tree.py          # Tree node schemas
│   │   └── common.py        # Shared schemas
│   │
│   ├── services/            # Business logic
│   │   ├── auth_service.py
│   │   ├── estimate_service.py
│   │   ├── item_service.py
│   │   ├── tree_service.py
│   │   └── email_service.py
│   │
│   ├── repositories/        # Data access layer
│   │   ├── base.py          # Base repository
│   │   ├── user_repo.py
│   │   ├── estimate_repo.py
│   │   ├── item_repo.py
│   │   └── tree_repo.py
│   │
│   ├── middleware/          # Custom middleware
│   │   ├── error_handler.py
│   │   ├── rate_limit.py
│   │   └── logging.py
│   │
│   ├── utils/               # Utilities
│   │   ├── decorators.py
│   │   ├── exceptions.py
│   │   └── helpers.py
│   │
│   └── main.py              # FastAPI app entry
│
├── tests/                   # Pytest tests
│   ├── api/
│   ├── services/
│   └── conftest.py
│
├── scripts/                 # Utility scripts
│   ├── migrate_from_sql.py  # Data migration
│   └── seed_data.py         # Seed Firestore
│
├── .env.example
├── Dockerfile
├── pyproject.toml           # Poetry config
├── poetry.lock
└── README.md
```

---

## Data Model Design (Firestore)

### Collection Structure

#### 1. **users** Collection
```typescript
users/{userId}
{
  uid: string                    // Firebase Auth UID
  email: string
  displayName: string
  role: "contractor" | "admin"
  createdAt: Timestamp
  updatedAt: Timestamp
  
  // Profile data
  profile: {
    companyName?: string
    phone?: string
    address?: {
      street: string
      city: string
      state: string
      zip: string
    }
  }
  
  // Settings
  settings: {
    emailNotifications: boolean
    theme: "light" | "dark"
  }
  
  // Stats
  stats: {
    estimatesCreated: number
    lastLoginAt: Timestamp
  }
}
```

#### 2. **estimates** Collection with Subcollection
```typescript
estimates/{estimateId}
{
  id: string
  userId: string                 // Owner
  name: string
  description: string
  status: "draft" | "active" | "completed" | "template"
  
  // Customer info
  customer: {
    name: string
    email: string
    phone: string
    address: object
  }
  
  // Pricing
  pricing: {
    subtotal: number
    tax: number
    discount: number
    total: number
  }
  
  // Metadata
  createdAt: Timestamp
  updatedAt: Timestamp
  version: number                // For versioning
  isTemplate: boolean
  
  // Search helper
  searchTerms: string[]          // Lowercase words for search
}

// Subcollection for line items
estimates/{estimateId}/lineItems/{lineItemId}
{
  id: string
  itemId: string                 // Reference to catalog
  nodeId: string                 // Tree node reference
  
  // Item details (denormalized for speed)
  name: string
  description: string
  category: string
  
  // Pricing
  quantity: number
  unitPrice: number
  totalPrice: number
  
  // Customization
  notes: string
  customFields: Record<string, any>
  
  // Ordering
  position: number
  parentLineItemId?: string      // For nested items
  
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

#### 3. **catalog** Collection (Tree Structure)
```typescript
catalog/{nodeId}
{
  id: string
  type: "category" | "item" | "accessory"
  
  // Tree structure
  parentId: string | null        // null for root nodes
  path: string[]                 // Full path of IDs for queries
  level: number                  // 0 for root, 1 for children, etc.
  position: number               // Sort order among siblings
  
  // Display
  name: string
  description: string
  icon?: string
  
  // For items only
  item?: {
    code: string
    unitPrice: number
    unitOfMeasure: string
    laborHours: number
    materialCost: number
    
    // Vendor info
    vendor?: {
      name: string
      sku: string
      url: string
    }
    
    // Configuration
    configurable: boolean
    options?: Array<{
      name: string
      type: "select" | "number" | "text"
      values?: string[]
      priceModifier?: number
    }>
  }
  
  // Metadata
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
  
  // Search
  searchTerms: string[]
  tags: string[]
  
  // Stats
  stats: {
    timesUsed: number
    lastUsedAt: Timestamp
  }
}
```

#### 4. **templates** Collection
```typescript
templates/{templateId}
{
  id: string
  userId: string                 // Creator
  name: string
  description: string
  category: string               // "bathroom" | "kitchen" | etc
  
  // Template metadata
  estimatedValue: number
  estimatedDuration: string      // "2-3 weeks"
  
  // Pre-populated items (denormalized)
  items: Array<{
    nodeId: string
    name: string
    quantity: number
    notes: string
  }>
  
  // Usage
  isPublic: boolean              // Share with other users?
  timesUsed: number
  
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

#### 5. **audit_logs** Collection
```typescript
audit_logs/{logId}
{
  id: string
  userId: string
  action: string                 // "estimate_created", "item_updated"
  entityType: string             // "estimate", "item"
  entityId: string
  
  // Changes (for update actions)
  changes?: {
    before: object
    after: object
  }
  
  // Context
  ipAddress: string
  userAgent: string
  
  timestamp: Timestamp
}
```

### Firestore Indexes

```javascript
// Composite indexes needed
[
  // Estimates by user, sorted by date
  { collection: "estimates", fields: ["userId", "createdAt desc"] },
  
  // Catalog items by category and active status
  { collection: "catalog", fields: ["type", "isActive", "position"] },
  
  // Line items for an estimate, sorted by position
  { collectionGroup: "lineItems", fields: ["estimateId", "position"] },
  
  // Search active items
  { collection: "catalog", fields: ["searchTerms", "isActive", "position"] },
  
  // Audit logs by user and time
  { collection: "audit_logs", fields: ["userId", "timestamp desc"] }
]
```

---

## API Design (FastAPI)

### Authentication Flow

```python
# POST /api/v1/auth/register
{
  "email": "contractor@example.com",
  "password": "securePassword123",
  "displayName": "John's Remodeling",
  "companyName": "John's Remodeling LLC"
}
# Response: { "user": {...}, "token": "jwt_token" }

# POST /api/v1/auth/login
{
  "email": "contractor@example.com",
  "password": "securePassword123"
}
# Response: { "user": {...}, "token": "jwt_token" }

# GET /api/v1/auth/me
# Headers: Authorization: Bearer {token}
# Response: { "user": {...} }
```

### Estimate Endpoints

```python
# GET /api/v1/estimates
# Query params: ?status=active&limit=20&cursor=xxx
# Response: { "items": [...], "nextCursor": "xxx" }

# POST /api/v1/estimates
{
  "name": "Smith Bathroom Remodel",
  "customer": {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "555-1234",
    "address": {...}
  }
}
# Response: { "id": "est_123", ... }

# GET /api/v1/estimates/{estimateId}
# Response: { "id": "est_123", "lineItems": [...], ... }

# PATCH /api/v1/estimates/{estimateId}
{
  "name": "Updated Name",
  "status": "completed"
}

# DELETE /api/v1/estimates/{estimateId}

# POST /api/v1/estimates/{estimateId}/line-items
{
  "itemId": "item_456",
  "quantity": 2,
  "notes": "Custom color: blue"
}

# PATCH /api/v1/estimates/{estimateId}/line-items/{lineItemId}
{
  "quantity": 3
}

# DELETE /api/v1/estimates/{estimateId}/line-items/{lineItemId}

# POST /api/v1/estimates/{estimateId}/version
# Creates a new version (snapshot) of estimate

# POST /api/v1/estimates/{estimateId}/duplicate
# Creates a copy

# GET /api/v1/estimates/{estimateId}/pdf
# Generates and returns PDF proposal
```

### Catalog/Tree Endpoints

```python
# GET /api/v1/tree/roots
# Response: [{ "id": "bathroom", "name": "Bathroom", "children": [] }]

# GET /api/v1/tree/node/{nodeId}/children
# Response: [{ "id": "child1", ... }]

# GET /api/v1/tree/node/{nodeId}/path
# Response: [{ "id": "root", ... }, { "id": "parent", ... }]

# GET /api/v1/items
# Query: ?category=bathroom&search=toilet&limit=50
# Response: { "items": [...] }

# GET /api/v1/items/{itemId}
# Response: { "id": "item_123", ... }

# Admin endpoints
# POST /api/v1/items
# PATCH /api/v1/items/{itemId}
# DELETE /api/v1/items/{itemId}
```

### Template Endpoints

```python
# GET /api/v1/templates
# Query: ?category=bathroom&isPublic=true

# POST /api/v1/templates
{
  "name": "Standard Bathroom Remodel",
  "category": "bathroom",
  "items": [...]
}

# POST /api/v1/templates/{templateId}/apply
# Body: { "estimateId": "est_123" }
# Applies template items to an estimate
```

---

## Frontend Architecture Details

### React Component Patterns

```typescript
// Example: EstimateList component
import { useQuery } from '@tanstack/react-query';
import { getEstimates } from '@/api/estimates';
import { EstimateCard } from '@/components/estimates/EstimateCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function EstimateList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['estimates'],
    queryFn: () => getEstimates({ status: 'active' }),
  });

  if (isLoading) {
    return <div className="grid gap-4">{
      Array(3).fill(0).map((_, i) => <Skeleton key={i} />)
    }</div>;
  }

  if (error) {
    return <ErrorAlert error={error} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold">Estimates</h2>
        <Button onClick={() => navigate('/estimates/new')}>
          New Estimate
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.items.map(estimate => (
          <EstimateCard key={estimate.id} estimate={estimate} />
        ))}
      </div>
    </div>
  );
}
```

### State Management Strategy

```typescript
// Auth Store (Zustand)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

// Usage in components
const { user, token } = useAuthStore();
```

### Custom Hooks

```typescript
// hooks/useEstimates.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/api/estimates';

export function useEstimates(filters?: EstimateFilters) {
  return useQuery({
    queryKey: ['estimates', filters],
    queryFn: () => api.getEstimates(filters),
  });
}

export function useCreateEstimate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createEstimate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
    },
  });
}

// Usage
const { data: estimates } = useEstimates({ status: 'active' });
const createMutation = useCreateEstimate();

const handleCreate = async (data: CreateEstimateInput) => {
  await createMutation.mutateAsync(data);
};
```

### Tree Component (Modern)

```typescript
// components/catalog/ItemTree.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ChevronDown, Folder, FileText } from 'lucide-react';
import { getTreeChildren } from '@/api/tree';
import { cn } from '@/lib/utils';

interface TreeNodeProps {
  node: TreeNode;
  level: number;
  onSelectItem?: (itemId: string) => void;
}

function TreeNode({ node, level, onSelectItem }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { data: children } = useQuery({
    queryKey: ['tree', node.id, 'children'],
    queryFn: () => getTreeChildren(node.id),
    enabled: isExpanded && node.type === 'category',
  });

  const hasChildren = node.type === 'category';
  const Icon = node.type === 'category' ? Folder : FileText;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 py-2 px-3 hover:bg-accent rounded-md cursor-pointer",
          "transition-colors"
        )}
        style={{ paddingLeft: `${level * 1.5}rem` }}
        onClick={() => {
          if (hasChildren) {
            setIsExpanded(!isExpanded);
          } else {
            onSelectItem?.(node.id);
          }
        }}
      >
        {hasChildren && (
          isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
        )}
        <Icon size={16} className="text-muted-foreground" />
        <span className="text-sm">{node.name}</span>
      </div>
      
      {isExpanded && children?.map(child => (
        <TreeNode
          key={child.id}
          node={child}
          level={level + 1}
          onSelectItem={onSelectItem}
        />
      ))}
    </div>
  );
}
```

---

## Backend Service Layer

### Example: Estimate Service

```python
# app/services/estimate_service.py
from typing import List, Optional
from datetime import datetime
from google.cloud.firestore_v1 import FieldFilter

from app.repositories.estimate_repo import EstimateRepository
from app.models.estimate import Estimate, EstimateCreate, LineItemCreate
from app.core.firebase import get_firestore
from app.utils.exceptions import NotFoundError, PermissionError

class EstimateService:
    def __init__(self):
        self.repo = EstimateRepository(get_firestore())
    
    async def get_user_estimates(
        self,
        user_id: str,
        status: Optional[str] = None,
        limit: int = 20,
        cursor: Optional[str] = None
    ) -> tuple[List[Estimate], Optional[str]]:
        """Get estimates for a user with pagination."""
        filters = [FieldFilter("userId", "==", user_id)]
        
        if status:
            filters.append(FieldFilter("status", "==", status))
        
        estimates, next_cursor = await self.repo.query(
            filters=filters,
            order_by="createdAt",
            order_direction="desc",
            limit=limit,
            cursor=cursor
        )
        
        return estimates, next_cursor
    
    async def create_estimate(
        self,
        user_id: str,
        data: EstimateCreate
    ) -> Estimate:
        """Create a new estimate."""
        estimate = Estimate(
            userId=user_id,
            name=data.name,
            description=data.description or "",
            status="draft",
            customer=data.customer,
            pricing={
                "subtotal": 0,
                "tax": 0,
                "discount": 0,
                "total": 0
            },
            createdAt=datetime.utcnow(),
            updatedAt=datetime.utcnow(),
            version=1,
            isTemplate=False,
            searchTerms=self._generate_search_terms(data.name)
        )
        
        estimate_id = await self.repo.create(estimate)
        estimate.id = estimate_id
        
        # Log audit
        await self._log_audit(user_id, "estimate_created", estimate_id)
        
        return estimate
    
    async def add_line_item(
        self,
        user_id: str,
        estimate_id: str,
        data: LineItemCreate
    ) -> str:
        """Add line item to estimate."""
        # Verify ownership
        estimate = await self.repo.get(estimate_id)
        if not estimate or estimate.userId != user_id:
            raise PermissionError("Access denied")
        
        # Get item details from catalog
        item = await self.item_service.get_item(data.itemId)
        
        line_item = {
            "itemId": data.itemId,
            "nodeId": item.nodeId,
            "name": item.name,
            "description": item.description,
            "category": item.category,
            "quantity": data.quantity,
            "unitPrice": item.unitPrice,
            "totalPrice": data.quantity * item.unitPrice,
            "notes": data.notes or "",
            "position": await self._get_next_position(estimate_id),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        line_item_id = await self.repo.add_line_item(estimate_id, line_item)
        
        # Recalculate estimate totals
        await self._recalculate_totals(estimate_id)
        
        return line_item_id
    
    async def _recalculate_totals(self, estimate_id: str):
        """Recalculate estimate pricing."""
        line_items = await self.repo.get_line_items(estimate_id)
        
        subtotal = sum(item.totalPrice for item in line_items)
        tax = subtotal * 0.0875  # Example tax rate
        total = subtotal + tax
        
        await self.repo.update(estimate_id, {
            "pricing": {
                "subtotal": subtotal,
                "tax": tax,
                "discount": 0,
                "total": total
            },
            "updatedAt": datetime.utcnow()
        })
    
    def _generate_search_terms(self, text: str) -> List[str]:
        """Generate lowercase words for search."""
        return list(set(text.lower().split()))
```

### Tree Service with Path Materialization

```python
# app/services/tree_service.py
from typing import List, Optional
from app.repositories.tree_repo import TreeRepository
from app.models.tree import TreeNode

class TreeService:
    def __init__(self):
        self.repo = TreeRepository()
    
    async def get_root_nodes(self) -> List[TreeNode]:
        """Get top-level categories."""
        return await self.repo.query(
            filters=[("parentId", "==", None)],
            order_by="position"
        )
    
    async def get_children(self, node_id: str) -> List[TreeNode]:
        """Get direct children of a node."""
        return await self.repo.query(
            filters=[("parentId", "==", node_id)],
            order_by="position"
        )
    
    async def get_path_to_node(self, node_id: str) -> List[TreeNode]:
        """Get full path from root to node."""
        node = await self.repo.get(node_id)
        if not node:
            return []
        
        # Use materialized path
        path_ids = node.path
        nodes = []
        for path_id in path_ids:
            n = await self.repo.get(path_id)
            if n:
                nodes.append(n)
        
        return nodes
    
    async def search_items(
        self,
        query: str,
        category: Optional[str] = None
    ) -> List[TreeNode]:
        """Search catalog items."""
        terms = query.lower().split()
        
        filters = [
            ("type", "==", "item"),
            ("isActive", "==", True)
        ]
        
        if category:
            filters.append(("path", "array_contains", category))
        
        # Firestore doesn't have full-text search,
        # so we search by array-contains on searchTerms
        results = []
        for term in terms:
            items = await self.repo.query(
                filters=filters + [("searchTerms", "array_contains", term)]
            )
            results.extend(items)
        
        # Deduplicate
        seen = set()
        unique_results = []
        for item in results:
            if item.id not in seen:
                seen.add(item.id)
                unique_results.append(item)
        
        return unique_results
```

---

## Security Implementation

### JWT Authentication

```python
# app/core/security.py
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT token."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=24)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm="HS256"
    )
    
    return encoded_jwt

def verify_token(token: str) -> dict:
    """Verify and decode JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=["HS256"]
        )
        return payload
    except JWTError:
        raise ValueError("Invalid token")

def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password."""
    return pwd_context.verify(plain_password, hashed_password)
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid))
               .data.role == 'admin';
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow create: if isAuthenticated();
      allow update: if isOwner(userId);
      allow delete: if false;  // Never allow user deletion via client
    }
    
    // Estimates collection
    match /estimates/{estimateId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() && 
                       request.resource.data.userId == request.auth.uid;
      allow update: if isOwner(resource.data.userId);
      allow delete: if isOwner(resource.data.userId);
      
      // Line items subcollection
      match /lineItems/{lineItemId} {
        allow read, write: if isOwner(
          get(/databases/$(database)/documents/estimates/$(estimateId)).data.userId
        );
      }
    }
    
    // Catalog (read-only for users, write for admins)
    match /catalog/{nodeId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    // Templates
    match /templates/{templateId} {
      allow read: if isAuthenticated() && 
                     (resource.data.isPublic == true || 
                      isOwner(resource.data.userId));
      allow create: if isAuthenticated();
      allow update, delete: if isOwner(resource.data.userId);
    }
    
    // Audit logs (write-only, read for admins)
    match /audit_logs/{logId} {
      allow read: if isAdmin();
      allow write: if false;  // Only server can write
    }
  }
}
```

---

## Deployment Architecture

### Infrastructure (Google Cloud Platform)

```yaml
# docker-compose.yml (local development)
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=development
      - GOOGLE_APPLICATION_CREDENTIALS=/app/credentials.json
      - SECRET_KEY=${SECRET_KEY}
    volumes:
      - ./backend:/app
      - ./credentials.json:/app/credentials.json:ro
    command: uvicorn app.main:app --host 0.0.0.0 --reload

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev -- --host
```

### Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install Poetry
RUN pip install poetry

# Copy dependency files
COPY pyproject.toml poetry.lock ./

# Install dependencies
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Cloud Run Deployment

```yaml
# backend-cloudrun.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: remodelator-api
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "0"
        autoscaling.knative.dev/maxScale: "10"
    spec:
      containers:
        - image: gcr.io/PROJECT_ID/remodelator-api:latest
          ports:
            - containerPort: 8000
          env:
            - name: ENVIRONMENT
              value: "production"
            - name: SECRET_KEY
              valueFrom:
                secretKeyRef:
                  name: api-secrets
                  key: secret-key
          resources:
            limits:
              memory: 512Mi
              cpu: 1
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to GCP

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: ${{ secrets.GCP_PROJECT_ID }}
      
      - name: Build and push Docker image
        run: |
          cd backend
          gcloud builds submit --tag gcr.io/${{ secrets.GCP_PROJECT_ID }}/remodelator-api
      
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy remodelator-api \
            --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/remodelator-api \
            --platform managed \
            --region us-central1 \
            --allow-unauthenticated
  
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install and build
        run: |
          cd frontend
          npm ci
          npm run build
      
      - name: Deploy to Firebase Hosting
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SA }}'
          channelId: live
          projectId: ${{ secrets.GCP_PROJECT_ID }}
```

---

## Cost Estimation (GCP)

### Firestore Costs (Low Usage Scenario)

```
Assuming:
- 10 contractors
- 50 estimates per month
- 500 reads per day per user (5,000/day total)
- 100 writes per day per user (1,000/day total)

Firestore Pricing:
- Stored data: 1GB free, then $0.18/GB/month
  Estimate: ~500MB = FREE

- Document reads: 50,000 free/day
  Usage: 5,000/day = FREE

- Document writes: 20,000 free/day
  Usage: 1,000/day = FREE

- Document deletes: 20,000 free/day
  Usage: <100/day = FREE

Monthly Firestore Cost: $0 (within free tier)
```

### Cloud Run Costs

```
Assuming:
- 10,000 requests per month
- 500ms average response time
- 512MB memory allocation

Cloud Run Pricing:
- First 2 million requests free
- CPU: $0.00002400 per vCPU-second
- Memory: $0.00000250 per GiB-second

Calculation:
- CPU time: 10,000 * 0.5s * 1 vCPU = 5,000 vCPU-seconds
  Cost: 5,000 * $0.000024 = $0.12

- Memory: 10,000 * 0.5s * 0.5GB = 2,500 GiB-seconds
  Cost: 2,500 * $0.0000025 = $0.006

Monthly Cloud Run Cost: ~$0.13
```

### Cloud Storage (Images/PDFs)

```
Assuming:
- 1GB total storage
- 1,000 operations per month

Storage Pricing:
- Storage: $0.020 per GB/month
- Operations: Class A (writes): $0.05 per 10,000

Monthly Storage Cost: $0.02
```

### **Total Estimated Monthly Cost: ~$0.15**

(Essentially free for small contractor business!)

### Medium Usage Scenario (50 contractors)

```
Firestore:
- 5GB storage: $0.90
- 50K reads/day (1.5M/month): Still in free tier
- 10K writes/day (300K/month): $0.72

Cloud Run:
- 100K requests/month: $1.30

Cloud Storage:
- 10GB: $0.20

Total: ~$3.12/month
```

---

## Migration Strategy

### Phase 1: Data Migration from SQL Server

```python
# scripts/migrate_from_sql.py
import pyodbc
from google.cloud import firestore
from datetime import datetime

class DataMigrator:
    def __init__(self, sql_conn_str: str, firestore_client):
        self.sql_conn = pyodbc.connect(sql_conn_str)
        self.db = firestore_client
    
    async def migrate_users(self):
        """Migrate users from SQL to Firestore."""
        cursor = self.sql_conn.cursor()
        cursor.execute("""
            SELECT 
                s.SubscriberId, s.CompanyName, s.ContactName,
                s.Email, s.Phone, s.Address, s.City, s.State, s.Zip,
                u.UserId, u.CreateDate
            FROM Subscriber s
            JOIN aspnet_Users u ON s.UserId = u.UserId
        """)
        
        batch = self.db.batch()
        count = 0
        
        for row in cursor:
            user_ref = self.db.collection('users').document(str(row.SubscriberId))
            user_data = {
                'email': row.Email,
                'displayName': row.ContactName,
                'role': 'contractor',
                'profile': {
                    'companyName': row.CompanyName,
                    'phone': row.Phone,
                    'address': {
                        'street': row.Address,
                        'city': row.City,
                        'state': row.State,
                        'zip': row.Zip
                    }
                },
                'createdAt': row.CreateDate or datetime.utcnow(),
                'updatedAt': datetime.utcnow()
            }
            
            batch.set(user_ref, user_data)
            count += 1
            
            if count % 500 == 0:
                await batch.commit()
                batch = self.db.batch()
        
        await batch.commit()
        print(f"Migrated {count} users")
    
    async def migrate_catalog(self):
        """Migrate catalog tree structure."""
        cursor = self.sql_conn.cursor()
        cursor.execute("""
            SELECT 
                n.NodeId, n.ParentId, n.Name, n.NodeTypeId,
                n.Position, n.Prefix,
                i.ItemId, i.Code, i.Description, i.UnitPrice,
                i.UnitOfMeasure, i.LaborHours, i.MaterialCost
            FROM NodeItemView n
            LEFT JOIN Item i ON n.ItemId = i.ItemId
            ORDER BY n.NodeId
        """)
        
        batch = self.db.batch()
        count = 0
        
        for row in cursor:
            node_ref = self.db.collection('catalog').document(str(row.NodeId))
            
            # Determine node type
            node_type = {
                1: 'item',
                2: 'category',
                3: 'accessory'
            }.get(row.NodeTypeId, 'category')
            
            # Calculate path (would need recursive function in production)
            path = self._calculate_path(row.NodeId, row.ParentId)
            
            node_data = {
                'type': node_type,
                'parentId': str(row.ParentId) if row.ParentId else None,
                'path': path,
                'level': len(path),
                'position': row.Position or 0,
                'name': row.Name,
                'description': row.Description or '',
                'isActive': True,
                'searchTerms': row.Name.lower().split(),
                'createdAt': datetime.utcnow(),
                'updatedAt': datetime.utcnow()
            }
            
            # Add item-specific data
            if node_type == 'item' and row.ItemId:
                node_data['item'] = {
                    'code': row.Code or '',
                    'unitPrice': float(row.UnitPrice or 0),
                    'unitOfMeasure': row.UnitOfMeasure or 'ea',
                    'laborHours': float(row.LaborHours or 0),
                    'materialCost': float(row.MaterialCost or 0),
                    'configurable': False,
                    'options': []
                }
            
            batch.set(node_ref, node_data)
            count += 1
            
            if count % 500 == 0:
                await batch.commit()
                batch = self.db.batch()
        
        await batch.commit()
        print(f"Migrated {count} catalog nodes")
    
    async def migrate_estimates(self):
        """Migrate orders/estimates."""
        cursor = self.sql_conn.cursor()
        cursor.execute("""
            SELECT 
                o.OrderId, o.SubscriberId, o.Name, o.Description,
                o.Status, o.JobAddress, o.JobCity, o.JobState, o.JobZip,
                o.CustomerName, o.CustomerEmail, o.CustomerPhone,
                o.Subtotal, o.Tax, o.Total,
                o.CreateDate, o.IsTemplate
            FROM [Order] o
        """)
        
        for row in cursor:
            estimate_ref = self.db.collection('estimates').document(str(row.OrderId))
            
            estimate_data = {
                'userId': str(row.SubscriberId),
                'name': row.Name,
                'description': row.Description or '',
                'status': row.Status.lower() if row.Status else 'draft',
                'customer': {
                    'name': row.CustomerName or '',
                    'email': row.CustomerEmail or '',
                    'phone': row.CustomerPhone or '',
                    'address': {
                        'street': row.JobAddress or '',
                        'city': row.JobCity or '',
                        'state': row.JobState or '',
                        'zip': row.JobZip or ''
                    }
                },
                'pricing': {
                    'subtotal': float(row.Subtotal or 0),
                    'tax': float(row.Tax or 0),
                    'discount': 0,
                    'total': float(row.Total or 0)
                },
                'createdAt': row.CreateDate or datetime.utcnow(),
                'updatedAt': datetime.utcnow(),
                'version': 1,
                'isTemplate': bool(row.IsTemplate),
                'searchTerms': (row.Name or '').lower().split()
            }
            
            await estimate_ref.set(estimate_data)
            
            # Migrate line items
            await self._migrate_line_items(row.OrderId)
        
        print(f"Migrated estimates")
    
    async def _migrate_line_items(self, order_id: int):
        """Migrate line items for an order."""
        cursor = self.sql_conn.cursor()
        cursor.execute("""
            SELECT 
                oi.OrderItemId, oi.ItemId, oi.NodeId,
                oi.Name, oi.Description, oi.Quantity,
                oi.UnitPrice, oi.TotalPrice, oi.Position
            FROM OrderItem oi
            WHERE oi.OrderId = ?
            ORDER BY oi.Position
        """, order_id)
        
        estimate_ref = self.db.collection('estimates').document(str(order_id))
        
        for row in cursor:
            line_item_ref = estimate_ref.collection('lineItems').document(str(row.OrderItemId))
            
            line_item_data = {
                'itemId': str(row.ItemId) if row.ItemId else '',
                'nodeId': str(row.NodeId) if row.NodeId else '',
                'name': row.Name,
                'description': row.Description or '',
                'quantity': float(row.Quantity or 1),
                'unitPrice': float(row.UnitPrice or 0),
                'totalPrice': float(row.TotalPrice or 0),
                'notes': '',
                'position': row.Position or 0,
                'createdAt': datetime.utcnow(),
                'updatedAt': datetime.utcnow()
            }
            
            await line_item_ref.set(line_item_data)

# Usage
if __name__ == "__main__":
    import asyncio
    from google.cloud import firestore
    
    sql_conn_str = "Driver={SQL Server};Server=...;Database=Remodelator;..."
    db = firestore.Client()
    
    migrator = DataMigrator(sql_conn_str, db)
    
    asyncio.run(migrator.migrate_users())
    asyncio.run(migrator.migrate_catalog())
    asyncio.run(migrator.migrate_estimates())
```

---

## Testing Strategy

### Frontend Tests (Vitest)

```typescript
// tests/components/EstimateList.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EstimateList } from '@/components/estimates/EstimateList';
import * as api from '@/api/estimates';

vi.mock('@/api/estimates');

describe('EstimateList', () => {
  it('renders loading state', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <EstimateList />
      </QueryClientProvider>
    );
    
    expect(screen.getAllByRole('status')).toBeTruthy();
  });
  
  it('renders estimates after loading', async () => {
    const mockEstimates = [
      { id: '1', name: 'Test Estimate 1' },
      { id: '2', name: 'Test Estimate 2' }
    ];
    
    vi.mocked(api.getEstimates).mockResolvedValue({
      items: mockEstimates,
      nextCursor: null
    });
    
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <EstimateList />
      </QueryClientProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Test Estimate 1')).toBeInTheDocument();
      expect(screen.getByText('Test Estimate 2')).toBeInTheDocument();
    });
  });
});
```

### Backend Tests (Pytest)

```python
# tests/api/test_estimates.py
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token

client = TestClient(app)

@pytest.fixture
def auth_headers():
    token = create_access_token({"sub": "test_user_123"})
    return {"Authorization": f"Bearer {token}"}

def test_create_estimate(auth_headers, mock_firestore):
    """Test creating a new estimate."""
    response = client.post(
        "/api/v1/estimates",
        json={
            "name": "Test Bathroom Remodel",
            "description": "Complete bathroom renovation",
            "customer": {
                "name": "John Doe",
                "email": "john@example.com",
                "phone": "555-1234",
                "address": {
                    "street": "123 Main St",
                    "city": "Springfield",
                    "state": "IL",
                    "zip": "62701"
                }
            }
        },
        headers=auth_headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Bathroom Remodel"
    assert data["status"] == "draft"
    assert "id" in data

def test_get_user_estimates(auth_headers, mock_firestore):
    """Test fetching user's estimates."""
    response = client.get(
        "/api/v1/estimates",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert isinstance(data["items"], list)

def test_unauthorized_access():
    """Test that endpoints require authentication."""
    response = client.get("/api/v1/estimates")
    assert response.status_code == 401
```

---

## Performance Optimization

### Frontend Optimizations

1. **Code Splitting**
```typescript
// Lazy load routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
const EstimateEditor = lazy(() => import('./pages/Estimates/EstimateEditor'));

// In App.tsx
<Suspense fallback={<LoadingScreen />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/estimates/:id" element={<EstimateEditor />} />
  </Routes>
</Suspense>
```

2. **React Query Optimizations**
```typescript
// Prefetch data on hover
const prefetchEstimate = (id: string) => {
  queryClient.prefetchQuery({
    queryKey: ['estimate', id],
    queryFn: () => getEstimate(id),
  });
};

// Stale-while-revalidate pattern
useQuery({
  queryKey: ['estimates'],
  queryFn: getEstimates,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

3. **Virtual Scrolling for Large Lists**
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function ItemList({ items }) {
  const parentRef = useRef(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
  });
  
  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div key={virtualItem.key} style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualItem.size}px`,
            transform: `translateY(${virtualItem.start}px)`
          }}>
            <ItemCard item={items[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Backend Optimizations

1. **Batch Firestore Operations**
```python
async def batch_create_line_items(estimate_id: str, items: List[LineItemCreate]):
    """Create multiple line items in a single batch."""
    batch = db.batch()
    
    for item in items:
        line_item_ref = db.collection('estimates').document(estimate_id)\
                          .collection('lineItems').document()
        batch.set(line_item_ref, item.dict())
    
    await batch.commit()
```

2. **Caching with Redis (optional for scale)**
```python
from redis import asyncio as aioredis
import json

class CacheService:
    def __init__(self):
        self.redis = aioredis.from_url("redis://localhost")
    
    async def get_cached_catalog(self):
        cached = await self.redis.get("catalog:tree")
        if cached:
            return json.loads(cached)
        return None
    
    async def cache_catalog(self, data, ttl=3600):
        await self.redis.setex(
            "catalog:tree",
            ttl,
            json.dumps(data)
        )
```

---

## Monitoring & Observability

### Frontend Monitoring (Sentry)

```typescript
// main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### Backend Logging (Structured)

```python
# app/core/logging_config.py
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_obj = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
        }
        
        if hasattr(record, 'user_id'):
            log_obj['user_id'] = record.user_id
        
        if record.exc_info:
            log_obj['exception'] = self.formatException(record.exc_info)
        
        return json.dumps(log_obj)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger(__name__)
logger.addHandler(logging.StreamHandler())
logger.handlers[0].setFormatter(JSONFormatter())
```

### GCP Cloud Monitoring

```python
from google.cloud import logging as cloud_logging

# Initialize Cloud Logging
logging_client = cloud_logging.Client()
logging_client.setup_logging()

# Logs automatically sent to Cloud Logging
logger.info("Estimate created", extra={
    "estimate_id": estimate.id,
    "user_id": user.id,
    "total": estimate.pricing.total
})
```

---

## Environment Configuration

### Frontend (.env)

```bash
# frontend/.env.example
VITE_API_URL=http://localhost:8000/api/v1
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_SENTRY_DSN=https://xxx@sentry.io/yyy
```

### Backend (.env)

```bash
# backend/.env.example
ENVIRONMENT=development
SECRET_KEY=your-secret-key-change-in-production
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
GCP_PROJECT_ID=your-project-id
CORS_ORIGINS=http://localhost:5173,https://yourdomain.com
SENTRY_DSN=https://xxx@sentry.io/yyy
```

---

## Summary & Next Steps

### Technology Benefits

| Benefit | Description |
|---------|-------------|
| **Cost** | ~$0-3/month for small business (vs $50-200/month traditional hosting) |
| **Performance** | Vite's HMR, React 18 optimizations, Firestore real-time |
| **Developer Experience** | TypeScript safety, modern tooling, hot reload |
| **Scalability** | Serverless auto-scaling, pay-per-use |
| **Maintenance** | Minimal server management, managed database |
| **Modern UX** | SPA, instant navigation, offline support |
| **Security** | Built-in auth, security rules, HTTPS everywhere |

### Implementation Timeline

**Phase 1: Foundation (2-3 weeks)**
- Set up Vite + React + TypeScript project
- Configure Tailwind + Shadcn/ui
- Set up FastAPI backend structure
- Configure Firestore + security rules
- Implement authentication (JWT + Firebase Auth)

**Phase 2: Core Features (4-6 weeks)**
- User registration and profiles
- Estimate CRUD operations
- Item catalog and tree navigation
- Line item management
- Basic PDF generation

**Phase 3: Advanced Features (3-4 weeks)**
- Templates system
- Search and filtering
- Real-time updates
- Email notifications
- Audit logging

**Phase 4: Polish & Launch (2-3 weeks)**
- UI/UX refinements
- Performance optimization
- Testing (E2E, integration)
- Documentation
- Deployment automation

**Total: 11-16 weeks**

### Development Order

1. **Start Backend First**: API structure, auth, basic CRUD
2. **Then Frontend Shell**: Routing, layout, auth UI
3. **Iterate Feature by Feature**: Estimates → Catalog → Templates
4. **Deploy Early**: Use Cloud Run preview deployments
5. **Migrate Data**: When features are stable

---

## Resources & References

### Documentation Links
- **Vite**: https://vitejs.dev/
- **React**: https://react.dev/
- **TypeScript**: https://www.typescriptlang.org/
- **TanStack Query**: https://tanstack.com/query/latest
- **Zustand**: https://zustand-demo.pmnd.rs/
- **Shadcn/ui**: https://ui.shadcn.com/
- **FastAPI**: https://fastapi.tiangolo.com/
- **Pydantic**: https://docs.pydantic.dev/
- **Firestore**: https://firebase.google.com/docs/firestore
- **Cloud Run**: https://cloud.google.com/run/docs

### Starter Templates
- Vite + React + TS: `npm create vite@latest my-app -- --template react-ts`
- FastAPI template: `poetry new backend && poetry add fastapi uvicorn`

---

**End of Modern Architecture Design**

*This document provides a production-ready architecture using modern, well-supported technologies with minimal operational costs.*
