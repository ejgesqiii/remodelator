# Remodelator 2 - Application Architecture Documentation

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Technology Stack](#technology-stack)
3. [Architecture Overview](#architecture-overview)
4. [Application Layers](#application-layers)
5. [Page Structure & Design](#page-structure--design)
6. [Data Access Layer](#data-access-layer)
7. [Business Logic Layer](#business-logic-layer)
8. [User Interface Components](#user-interface-components)
9. [Security & Authentication](#security--authentication)
10. [Key Design Patterns](#key-design-patterns)
11. [Page Catalog](#page-catalog)
12. [Database Schema](#database-schema)

---

## Executive Summary

**Remodelator 2** is a construction estimation and project management web application built in **2006-2013 era** using ASP.NET Web Forms with VB.NET. The application helps remodeling contractors create detailed estimates for various renovation projects (bathrooms, kitchens, basements, attics, exteriors, landscaping).

### Key Statistics
- **Primary Language**: VB.NET (Visual Basic .NET)
- **Total Pages**: ~79 web pages
- **User Controls**: 19 reusable components
- **Framework**: ASP.NET 2.0 Web Forms with AJAX Extensions
- **Database**: Microsoft SQL Server (692MB backup file)
- **Architecture**: 3-Tier (Presentation, Business Logic, Data Access)

---

## Technology Stack

### Backend Technologies
| Technology | Version | Purpose |
|-----------|---------|---------|
| **ASP.NET Web Forms** | 2.0 | Web application framework |
| **VB.NET** | 2.0 | Primary programming language |
| **AJAX Extensions** | 1.0.61025.0 | Asynchronous page updates |
| **LLBLGen Pro** | 2.x | ORM (Object-Relational Mapping) |
| **SQL Server** | 2005+ | Database engine |
| **Forms Authentication** | 2.0 | User authentication |

### Frontend Technologies
| Technology | Purpose |
|-----------|---------|
| **ComponentArt TreeView** | Commercial tree navigation control |
| **JavaScript/Prototype.js** | Client-side scripting framework |
| **CSS** | Styling (multiple stylesheets) |
| **AJAX** | Dynamic content loading |
| **Nifty Corners** | Rounded corner effects (pre-CSS3) |

### Third-Party Libraries
- **ComponentArt.Web.UI** - Advanced tree view control
- **log4net** - Logging framework
- **Prototype.js** - JavaScript framework
- **LLBLGen Pro** - ORM and code generation
- **USAePay API** - Payment processing integration

---

## Architecture Overview

### 3-Tier Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 PRESENTATION LAYER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   .ASPX      │  │ User Controls│  │  Master Page │ │
│  │   Pages      │  │   (.ASCX)    │  │ (site.master)│ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │ Code-Behind  │  │  JavaScript  │                    │
│  │  (.ASPX.VB)  │  │   (AJAX)     │                    │
│  └──────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│              BUSINESS LOGIC LAYER (BLL)                  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │    RemodelatorBLL.dll (Manager Classes)          │  │
│  │                                                   │  │
│  │  • TreeManager       • ItemManager               │  │
│  │  • OrderManager      • UserManager               │  │
│  │  • BaseClassManager  • ImportManager             │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │    App_Code (Helper Classes)                     │  │
│  │  • TreeHelper.vb     • Utilities.vb              │  │
│  │  • PageBase.vb       • SessionVals.vb            │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│              DATA ACCESS LAYER (DAL)                     │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │    RemodelatorDAL.dll (LLBLGen Generated)        │  │
│  │                                                   │  │
│  │  • Entity Classes    • Collection Classes        │  │
│  │  • Helper Classes    • Factory Classes           │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │    RemodelatorProviders.dll                      │  │
│  │  • MembershipProvider • RoleProvider             │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                        │
│           SQL Server (remodelator_2020.bak)             │
│                                                          │
│  • Tables: Nodes, Items, Orders, Subscribers, etc.      │
│  • Views: NodeItemView, OrderItemDetailView             │
│  • Stored Procedures                                    │
└─────────────────────────────────────────────────────────┘
```

---

## Application Layers

### 1. Presentation Layer (Web Pages & Controls)

#### Master Page System
- **site.master** - Single master page for entire application
  - Header with logo and login status
  - Tab navigation (via Tabs.ascx user control)
  - Two-column layout (content + right pane)
  - Session timeout detection
  - JavaScript includes

#### Base Classes
- **PageBase.vb** - Base class for all pages
  - Session management
  - Authentication checks
  - Common properties (Subscriber, Estimate, Mode)
  - Query string handling
  - ViewState logging
  - Page lifecycle management

- **ControlBase.vb** - Base class for all user controls
  - Access to parent page properties
  - Common control properties
  - Mode management

#### Session Management (SessionVals.vb)
Manages application state including:
- Current user (Subscriber)
- Active estimate (Order)
- Selected nodes in tree
- Admin mode (Item vs ItemAccessory)
- Last page visited

---

### 2. Business Logic Layer (BLL)

Located in `RemodelatorBLL.dll` - compiled assembly with business rules.

#### Manager Classes Pattern
Each domain entity has a corresponding Manager class:

```
TreeManager         → Manages hierarchical tree structure
OrderManager        → Handles estimate/order operations
ItemManager         → Manages remodeling items
UserManager         → User and subscriber operations
BaseClassManager    → Lookup tables (countries, states, etc.)
ImportManager       → Data import from spreadsheets
```

#### Key Responsibilities
- Business rule validation
- Transaction coordination
- Data aggregation
- Caching layer
- Audit logging

---

### 3. Data Access Layer (DAL)

Generated by **LLBLGen Pro ORM** tool.

#### Components

**RemodelatorDAL.dll**
- **Entity Classes** - Represent database tables
  - `NodeItemViewEntity`
  - `OrderEntity`
  - `SubscriberEntity`
  - `TreeEntity`
  - `ItemEntity`

- **Entity Collections** - Type-safe collections
  - `EntityCollection<NodeItemViewEntity>`
  
- **Helper Classes** - Field definitions and metadata

- **Factory Classes** - Object instantiation

**RemodelatorDALDBSpecific.dll**
- SQL Server specific implementations

**Key Features**
- Type-safe data access
- Lazy loading
- Automatic SQL generation
- Change tracking
- Relationship management

---

## Page Structure & Design

### Layout System

The application uses a **consistent two-column layout**:

```
┌─────────────────────────────────────────────────────┐
│                    HEADER                            │
│  Logo          User Info          [Logout]          │
├─────────────────────────────────────────────────────┤
│                  TAB NAVIGATION                      │
│  [Bath] [Kitchen] [Basement] [Attic] [Exterior]...  │
├──────────────────────────────┬──────────────────────┤
│                              │                      │
│     MAIN CONTENT AREA        │    RIGHT PANE       │
│     (ContentPlaceHolder)     │   (Navigation/      │
│                              │    Utilities)       │
│  • Tree navigation           │   • User profile    │
│  • Item details             │   • Quick links     │
│  • Forms                    │   • Context info    │
│                              │                     │
└──────────────────────────────┴─────────────────────┘
```

### Page Types

#### 1. **Category Pages** (Room-based)
Each remodeling category has a dedicated page:
- `Bath.aspx` - Bathroom remodeling
- `Kitchen.aspx` - Kitchen remodeling
- `Basement.aspx` - Basement finishing
- `Attic.aspx` - Attic conversions
- `Exterior.aspx` - Exterior work
- `DoorsWindows.aspx` - Doors & windows
- `Landscaping.aspx` - Landscaping work

**Common Features:**
- Tree view navigation (left side)
- Item browser control
- Job banner (active estimate)
- AJAX-enabled content updates

#### 2. **User Pages**
- `Home.aspx` - Public landing page
- `SubscriberHome.aspx` - User dashboard
- `SubscriberLogin.aspx` - Login page
- `Register.aspx` - User registration
- `ForgotPassword.aspx` - Password recovery
- `EditProfile.ascx` - Profile editing control

#### 3. **Estimate Pages**
- `Estimate.aspx` - Legacy estimate view
- `Estimate2.aspx` - Current estimate builder
- `ItemView.aspx` - Item detail view
- `Request.aspx` - AJAX callback for item data
- `Proposal.aspx` - Customer-facing proposal

#### 4. **Administrative Pages**
- `Admin.aspx` - Admin dashboard
- `Audit.aspx` - Audit log viewer
- `Suppliers.aspx` - Vendor management
- `FixOrderItems.aspx` - Data cleanup utility
- `TreeNodeLoader.aspx` - Tree data import tool

#### 5. **Utility Pages**
- `About.aspx` - About page
- `Links.aspx` - Useful links
- `Blog.aspx` - Blog/news
- `News.aspx` - News feed
- `Eula.aspx` - End User License Agreement
- `UserAgreement.aspx` - Terms of service

---

## User Interface Components

### User Controls (.ASCX)

#### Core Navigation Controls

**1. Tabs.ascx**
- Top-level navigation tabs
- Dynamically generated from database
- Shows available remodeling categories
- Persists selected tab in session

**2. RightPane.ascx**
- Sidebar navigation
- User profile summary
- Quick action links
- Context-sensitive content

**3. ItemBrowser.ascx**
- Main tree/content splitter view
- Uses ComponentArt Splitter control
- Tree navigation on left
- Item details on right
- AJAX callbacks for dynamic loading

#### Item Management Controls

**4. ItemAddEdit.ascx**
- Add/edit remodeling items
- Form validation
- Parent node selection
- Position ordering

**5. ItemDetail.ascx**
- Display item details
- Pricing information
- Vendor/supplier links
- Related accessories

**6. ItemConfig.ascx**
- Item configuration
- Option selection
- Quantity adjustments
- Price calculations

**7. ItemSelect.ascx**
- Item picker/selector
- Search functionality
- Tree-based selection
- Multi-select capability

#### User Management Controls

**8. EditProfile.ascx**
- User profile editing
- Contact information
- Company details
- Password change

**9. VendorAddEdit.ascx**
- Vendor/supplier management
- Contact details
- Product associations

---

### Tree Navigation System

The **tree navigation** is the core UI element for browsing the item hierarchy.

#### Implementation Details

**Technology:**
- **ComponentArt TreeView** control (commercial 3rd party)
- Why? Built-in ASP.NET TreeView was insufficient in 2006-2010
- Features: AJAX callbacks, drag-drop, custom styling, node templates

**Data Structure:**
```
Bathroom Remodeling (Root Node - Folder)
├── Demolition (Folder)
│   ├── Fixtures (Folder)
│   │   ├── Tub Cast Iron First Floor (Item)
│   │   ├── Toilet (Item)
│   │   └── Vanity Top With Sink (Item)
│   └── Flooring (Folder)
│       ├── Remove Vinyl Flooring (Item)
│       └── Remove Subflooring (Item)
├── Plumbing (Folder)
│   ├── Toilets (Folder)
│   └── Faucets (Folder)
└── Accessories (Folder)
```

**Node Types:**
1. **Folder** (NodeTypeId = 2) - Container nodes
2. **Item** (NodeTypeId = 1) - Actual remodeling items
3. **Accessory** (NodeTypeId = 3) - Optional add-ons

**Key Classes:**
- **TreeHelper.vb** - VB.NET wrapper for building trees
  - `BuildTree()` - Creates tree from database
  - `BuildTopLevelTree()` - Root nodes only
  - `ExpandTreePathToNode()` - Expands to specific node
  - `BuildHierarchy()` - Recursive tree building

- **TreeManager** (BLL) - Business logic
  - `GetRootNodes()` - Fetch top-level nodes
  - `GetNodeChildren()` - Get child nodes
  - `TreeAncestorList()` - Get path to node
  - `NodeInsert()` / `NodeUpdate()` / `NodeDelete()`

**AJAX Callbacks:**
- Tree nodes load dynamically on expand
- Content pane updates via AJAX (Request.aspx)
- No full page refreshes for navigation

---

## Data Access Layer

### ORM Strategy: LLBLGen Pro

**Why LLBLGen Pro?**
- Popular ORM in 2006-2010 before Entity Framework matured
- Code generation from database schema
- Type-safe queries
- Relationship management
- VB.NET support

### Entity Model

#### Key Entities

**NodeItemView** (Database View)
```vb
NodeItemViewEntity
├── NodeId (PK)
├── ParentId (FK)
├── Name
├── NodeTypeId (1=Item, 2=Folder, 3=Accessory)
├── Position (sort order)
├── Prefix (category code)
├── EditsComplete (validation flag)
└── ... (other fields)
```

**Order** (Estimate/Job)
```vb
OrderEntity
├── OrderId (PK)
├── SubscriberId (FK)
├── Name
├── JobAddress
├── Status
├── CreateDate
├── IsTemplate
└── OrderItems (Collection)
```

**Subscriber** (User)
```vb
SubscriberEntity
├── SubscriberId (PK)
├── UserId (FK to ASP.NET Membership)
├── CompanyName
├── ContactName
├── Email
├── Phone
└── Address fields
```

**Item**
```vb
ItemEntity
├── ItemId (PK)
├── NodeId (FK)
├── Code
├── Description
├── UnitPrice
├── UnitOfMeasure
├── VendorId (FK)
└── ... (pricing/config fields)
```

### Collection Patterns

```vb
' Type-safe collections
Dim nodes As EntityCollection(Of NodeItemViewEntity)
nodes = _TreeManager.GetRootNodes()

For Each node As NodeItemViewEntity In nodes
    ' Process each node
Next
```

### Caching Strategy

**SQL Cache Dependency**
```xml
<caching>
  <sqlCacheDependency enabled="true">
    <databases>
      <add name="Remodelator" 
           connectionStringName="RemodelatorConnect" 
           pollTime="60000"/>
    </databases>
  </sqlCacheDependency>
</caching>
```

- Database polling every 60 seconds
- Automatic cache invalidation on data changes
- Configured in web.config

---

## Security & Authentication

### Forms Authentication

```xml
<authentication mode="Forms">
  <forms name=".ASPXAUTH" 
         loginUrl="WebPages/Home.aspx" 
         protection="All" 
         timeout="30" 
         slidingExpiration="true"/>
</authentication>
```

### Custom Providers

**RemodelatorMembershipProvider**
- Custom implementation of ASP.NET Membership
- User account management
- Password hashing
- Email validation
- Security questions

**RemodelatorRoleProvider**
- Role-based access control
- Admin vs. Subscriber roles
- Page-level authorization

### Session Security

**Session Timeout Detection** (PageBase.vb)
```vb
' Detects expired sessions
If Session.IsNewSession Then
    If szCookieHeader.IndexOf("ASP.NET_SessionId") >= 0 Then
        ' Session expired, redirect to login
        FormsAuthentication.SignOut()
        Response.Redirect("Home.aspx")
    End If
End If
```

**Session State**
- Mode: InProc (in-process)
- Timeout: 20 minutes
- Cookieless: False (requires cookies)

---

## Key Design Patterns

### 1. **Page Controller Pattern**
Every page inherits from `PageBase`, providing:
- Centralized session management
- Authentication enforcement
- Common properties and methods
- Lifecycle hooks

### 2. **Template Method Pattern**
Base classes define algorithm structure:
```vb
' PageBase defines template
Protected Overrides Sub OnPreInit(e)
Protected Overrides Sub OnLoad(e)
Protected Overrides Sub OnPreRender(e)
```

### 3. **Repository Pattern**
Manager classes act as repositories:
```vb
Dim _TreeManager As New TreeManager()
Dim nodes = _TreeManager.GetRootNodes()
```

### 4. **Composite Pattern**
Tree structure uses composite:
- TreeViewNode contains child TreeViewNodes
- NodeEntity references parent NodeEntity

### 5. **Strategy Pattern**
Admin mode switches between views:
```vb
Public Enum AdminView
    Item         ' Show only items
    ItemAccessory ' Show only accessories
End Enum
```

### 6. **Master-Detail Pattern**
- Tree (master) + Item details (detail)
- Estimate list + Line items
- Order history + Order details

### 7. **AJAX Partial Page Updates**
- Tree node expansion
- Content pane updates
- Form validation feedback

---

## Page Catalog

### Complete Page Listing

| Page | Purpose | Auth Required |
|------|---------|--------------|
| **Public Pages** |
| Home.aspx | Landing page, login | No |
| About.aspx | About company | No |
| Register.aspx | User registration | No |
| ForgotPassword.aspx | Password recovery | No |
| **Subscriber Pages** |
| SubscriberHome.aspx | User dashboard | Yes |
| SubscriberLogin.aspx | Login page | No |
| Estimate.aspx | Legacy estimate view | Yes |
| Estimate2.aspx | Estimate builder | Yes |
| Proposal.aspx | Customer proposal | Yes |
| LaborSheet.aspx | Labor tracking | Yes |
| ItemView.aspx | Item details | Yes |
| **Category Pages** |
| Bath.aspx | Bathroom remodeling | Yes |
| Kitchen.aspx | Kitchen remodeling | Yes |
| Basement.aspx | Basement finishing | Yes |
| Attic.aspx | Attic conversions | Yes |
| Exterior.aspx | Exterior work | Yes |
| DoorsWindows.aspx | Doors & windows | Yes |
| Landscaping.aspx | Landscaping | Yes |
| **Administrative Pages** |
| Admin.aspx | Admin dashboard | Yes (Admin) |
| Audit.aspx | Audit logs | Yes (Admin) |
| Suppliers.aspx | Vendor management | Yes (Admin) |
| TreeNodeLoader.aspx | Data import | Yes (Admin) |
| FixOrderItems.aspx | Data cleanup | Yes (Admin) |
| **Utility Pages** |
| Request.aspx | AJAX data provider | Yes |
| Request2.aspx | Alternative AJAX | Yes |
| GetData.aspx | Data export | Yes |
| ProductHome.aspx | Product catalog | Mixed |
| Links.aspx | Resource links | No |
| Blog.aspx | Blog/news | No |
| News.aspx | News feed | No |
| Eula.aspx | License agreement | No |
| UserAgreement.aspx | Terms of service | No |
| **Test Pages** |
| Test.aspx | Development testing | Yes (Dev) |
| Test3.aspx | Testing page 3 | Yes (Dev) |
| Test4.aspx | Testing page 4 | Yes (Dev) |

---

## Database Schema

### Core Tables

**Tree Structure**
- `Tree` - Hierarchical node relationships
- `Node` - Node definitions (folders/items)
- `NodeType` - Type lookup (1=Item, 2=Folder, 3=Accessory)

**Items & Catalog**
- `Item` - Remodeling items/services
- `ItemCategory` - Categorization
- `ItemVendor` - Supplier associations
- `Accessory` - Optional add-ons

**Orders & Estimates**
- `Order` - Customer estimates/jobs
- `OrderItem` - Line items in estimate
- `OrderStatus` - Status lookup

**Users**
- `Subscriber` - Application users (contractors)
- `aspnet_Users` - ASP.NET Membership users
- `aspnet_Roles` - Role definitions
- `aspnet_UsersInRoles` - User-role mapping

**Lookup Tables**
- `Tab` - Navigation tabs
- `CardType` - Payment card types
- `Country` - Countries
- `State` - US States
- `Hint` - Help text/hints

**Audit & Logging**
- `AuditLog` - User actions audit trail

### Key Views

**NodeItemView**
- Denormalized view joining Node + Item + Tree
- Used extensively for tree building
- Performance optimization

**OrderItemDetailView**
- Complete order line item information
- Includes pricing, calculations, descriptions

### Stored Procedures
- Generated by LLBLGen Pro
- CRUD operations for each entity
- Custom procedures for complex queries

---

## JavaScript & Client-Side

### JavaScript Libraries

**Prototype.js**
- DOM manipulation
- AJAX helpers
- Event handling
- Base framework for other scripts

**Cloz2007.js**
- Custom application scripts
- Form validation
- UI enhancements

**CookieJar2.js**
- Cookie management
- User preferences
- Session persistence

**niftycube.js**
- Rounded corners effect (pre-CSS3)
- Visual polish

**submodal.js**
- Modal dialog boxes
- Popup windows
- Overlay effects

**multifile.js**
- File upload handling
- Multiple file selection

### AJAX Patterns

**Tree Node Expansion**
```javascript
function tvItems_NodeSelected(sender, eventArgs) { 
    // Show loading overlay
    var overLay = $("Overlay1");
    overLay.style.display = "";
    
    // Trigger node expansion
    eventArgs.get_node().expand();
}
```

**Content Callbacks**
```vb
' Server-side: Set callback URL
NewNode.ContentCallbackUrl = "Request.aspx?ID=" & NodeId
```

---

## Configuration & Settings

### Web.config Key Settings

**Connection String**
```xml
<connectionStrings>
  <add name="RemodelatorConnect" 
       connectionString="Data Source=sql17.comstar.biz;
                        Initial Catalog=Remodelator;
                        User ID=remodelator_admin;
                        Password=modelagainandagain;" />
</connectionStrings>
```

**Application Settings**
```xml
<appSettings>
  <add key="Caching" value="True"/>
  <add key="EncryptQueryString" value="False"/>
  <add key="EnablePrinting" value="True"/>
  <add key="USAEPayProcessing" value="False"/>
  <add key="DeveloperMode" value="True"/>
  <add key="SMTPServer" value="mail.wauknet.com"/>
  <add key="EmailRecipients" value="djmarkert@gmail.com"/>
  <add key="EmailSender" value="errors@remodelator.com"/>
</appSettings>
```

**Session Configuration**
```xml
<sessionState mode="InProc"
              cookieless="false"
              timeout="20" />
```

### Logging (log4net)

```xml
<log4net>
  <appender name="RollingFile" type="log4net.Appender.RollingFileAppender">
    <file value="cloz2006.log"/>
    <maximumFileSize value="100KB"/>
    <maxSizeRollBackups value="2"/>
  </appender>
</log4net>
```

- Logs to `cloz2006.log`
- Rolling file appender (100KB max)
- Debug level logging
- Page size and ViewState size tracking

---

## Performance Considerations

### ViewState Management
- ViewState size logged on every request
- Base64 encoded state in hidden field
- Can cause large page sizes

### Caching Strategy
- SQL cache dependency (60 second poll)
- Session state in-process (faster, but not scalable)
- Application-level caching for lookup data

### Database Optimization
- Views for denormalized data
- Indexed foreign keys
- Generated queries by LLBLGen Pro

### AJAX for Reduced Payloads
- Partial page updates
- Tree node callbacks
- Content pane updates

---

## Development Workflow

### Code Organization

```
Remodelator 2/
├── App_Code/              # Shared code (PageBase, helpers)
├── Bin/                   # Compiled assemblies
│   ├── RemodelatorBLL.dll
│   ├── RemodelatorDAL.dll
│   └── ComponentArt.Web.UI.dll
├── Includes/              # JavaScript, CSS
├── Styles/                # CSS stylesheets
├── Images/                # Image assets
├── MasterPages/           # Master page(s)
├── UserControls/          # Reusable controls (.ascx)
├── WebPages/              # Application pages (.aspx)
└── web.config             # Configuration
```

### Compilation Model
- **Web Site Project** (not Web Application Project)
- Dynamic compilation in App_Code
- Pre-compiled DLLs in Bin folder
- No project file (.csproj/.vbproj)

---

## Migration & Modernization Notes

### Technical Debt
1. **Old .NET Version** - ASP.NET 2.0 (2005)
2. **VB.NET** - Less common than C# today
3. **Web Forms** - Legacy technology, replaced by MVC/Razor/Blazor
4. **ComponentArt** - Commercial library, may be unsupported
5. **LLBLGen Pro** - Requires license for modifications
6. **SQL Connection String** - Hardcoded in web.config with password
7. **In-Process Sessions** - Not web farm friendly

### Modernization Path Options

**Option 1: Incremental Refactor**
1. Upgrade to .NET 4.8 (last .NET Framework)
2. Convert VB.NET to C#
3. Replace ComponentArt with modern controls
4. Keep Web Forms but improve

**Option 2: Full Rewrite**
1. ASP.NET Core MVC or Blazor
2. C# language
3. Entity Framework Core
4. Modern JavaScript (React/Vue)
5. Responsive design

**Option 3: Hybrid Approach**
1. Keep database as-is
2. Build new API layer (ASP.NET Core Web API)
3. New modern frontend (SPA)
4. Gradual feature migration

---

## Appendices

### A. Enumeration Definitions

```vb
' Node types in tree
Public Enum NodeType
    Item = 1
    Folder = 2
    Accessory = 3
End Enum

' Page actions
Public Enum PageAction
    Add
    Update
    Delete
    Copy
    View
End Enum

' Admin viewing modes
Public Enum AdminView
    Item          ' Show items
    ItemAccessory ' Show accessories
End Enum

' Control/page modes
Public Enum PageMode
    View
    Add
    Edit
    Locked
End Enum
```

### B. Key Directories

| Directory | Purpose |
|-----------|---------|
| `/App_Code/` | Shared VB.NET classes |
| `/App_Code/Modules/` | HTTP modules |
| `/Bin/` | Compiled assemblies (.dll) |
| `/Includes/` | JavaScript libraries |
| `/Styles/` | CSS stylesheets |
| `/Images/` | Graphics (194 GIFs, 5 JPGs) |
| `/MasterPages/` | Master page template |
| `/UserControls/` | Reusable ASCX controls |
| `/WebPages/` | Application pages |
| `/aspnet_client/` | ASP.NET framework files |

### C. File Counts

- **ASPX Pages**: ~40 active pages
- **ASPX.VB Code-behind**: ~40 files
- **ASCX Controls**: 11 active controls
- **ASCX.VB Code-behind**: 11 files
- **DLL Assemblies**: 12 files
- **JavaScript Files**: 10 files
- **CSS Files**: 8 files
- **Images**: 199 files (194 GIF, 5 JPG)

---

## Glossary

| Term | Definition |
|------|------------|
| **ASPX** | ASP.NET web page file extension |
| **ASCX** | ASP.NET user control file extension |
| **BLL** | Business Logic Layer |
| **DAL** | Data Access Layer |
| **ORM** | Object-Relational Mapping |
| **Entity** | Database table represented as object |
| **Node** | Tree structure element (folder or item) |
| **Subscriber** | Application user (contractor) |
| **Estimate** | Project quote/proposal (Order) |
| **Master Page** | Template defining page layout |
| **ViewState** | ASP.NET page state storage |
| **Code-behind** | Server-side code for a page/control |

---

## Document Information

- **Document Version**: 1.0
- **Date Created**: February 6, 2026
- **Application Version**: Remodelator 2.0 (circa 2013)
- **Database Backup**: remodelator_2020_20230811.bak (August 11, 2023)
- **Technology Era**: 2006-2013

---

**End of Documentation**
