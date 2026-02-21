Option Strict On

Imports System
Imports System.Data
Imports System.Collections
Imports System.Collections.Generic

Imports RemodelatorDAL.EntityClasses

Imports RemodelatorBLL

Namespace Remodelator

    ''' <summary>
    ''' This class represents global values that must be tracked per user session
    ''' </summary>
    ''' <remarks></remarks>
    <Serializable()> _
    Public Class SessionVals

        Public SessID As Integer

        Public Sub New()

        End Sub


    End Class

End Namespace
