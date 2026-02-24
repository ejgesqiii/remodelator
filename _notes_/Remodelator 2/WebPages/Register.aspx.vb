Imports System.Diagnostics
Imports System.Collections.Generic
Imports RemodelatorBLL
Imports RemodelatorDAL.EntityClasses
Imports RemodelatorDAL.HelperClasses

Imports SD.LLBLGen.Pro.ORMSupportClasses

Imports ComponentArt.Web.UI

Namespace Remodelator

    Partial Class Register
        Inherits PageBase

        Dim _TreeManager As New TreeManager()


#Region "Public Properties"

#End Region

#Region "Page Events"

        Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load

            Master.ColumnCount = 1

            If Not Page.IsPostBack Then
                ucEditProfile.ControlMode = PageMode.Add
                ucEditProfile.Reload = True
            End If
        End Sub

#End Region

#Region "Control Events"

#End Region

#Region "Public Helpers"

#End Region

#Region "Private Helpers"

#End Region

    End Class

End Namespace
