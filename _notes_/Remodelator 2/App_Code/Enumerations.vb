Option Strict On

Namespace Remodelator

    ''' <summary>
    ''' The types of items that can appear in the tree
    ''' </summary>
    ''' <remarks></remarks>
    Public Enum NodeType
        Item
        Folder
        Accessory
        None
    End Enum

    ''' The types of actions that can occur on a page
    Public Enum PageAction
        Add
        Update
        Delete
        Copy
        View
        None
    End Enum

    Public Enum AdminView
        Item
        ItemAccessory
    End Enum

    Public Enum WebPage
        Home
        Bath
        Kitchen
        Attic
        Basement
        ExtStructure
        Landscaping
        Admin
    End Enum

    Public Enum PageMode
        View
        Add
        Edit
        Locked  'View only mode used during Add
    End Enum

End Namespace
