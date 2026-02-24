Imports System.Diagnostics
Imports System.Collections.Generic
Imports RemodelatorBLL
Imports RemodelatorDAL.EntityClasses
Imports RemodelatorDAL.HelperClasses

Imports SD.LLBLGen.Pro.ORMSupportClasses

Imports ComponentArt.Web.UI

Namespace Remodelator

    Partial Class SubscriberLogin
        Inherits PageBase

        Dim _TreeManager As New TreeManager()


#Region "Public Properties"

#End Region

#Region "Page Events"

        Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load

            If Not Page.IsPostBack Then
                DataBindCardTypes()
                DataBindCreditCardExpirationInfo()
            End If
        End Sub

        Protected Sub Page_PreRender(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.PreRender
            firstName.ReadOnly = False
            lastName.ReadOnly = False
            company.ReadOnly = False
            cardType.ReadOnly = False
            cardName.ReadOnly = False
            cardNo.ReadOnly = False
            cardExpMonth.ReadOnly = False
            cardExpYear.ReadOnly = False
            cardCvv.ReadOnly = False
            cardAddr.ReadOnly = False
            cardZip.ReadOnly = False
        End Sub

#End Region

#Region "Control Events"

        Protected Sub btnLogin_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles btnLogin.Click
            Response.Redirect("Eula.aspx")
        End Sub


#End Region

#Region "Public Helpers"

#End Region

#Region "Private Helpers"

        Private Sub DataBindCardTypes()

            'Get all order sources and databind
            Dim cardTypes As EntityCollection(Of CardTypeEntity) = New BaseClassManager().CardTypeList("Select Type")
            cardType.DataSource = cardTypes
            cardType.DataTextField = "CardType"
            cardType.DataValueField = "CardTypeID"
            cardType.DataBind()

        End Sub

        Private Sub DataBindCreditCardExpirationInfo()

            Dim Months As New SortedList()
            Dim Years As New SortedList()

            For X As Integer = 1 To 12
                If X < 10 Then
                    Months.Add("0" & X, X)
                Else
                    Months.Add("" & X, X)
                End If
            Next

            cardExpMonth.DataSource = Months
            cardExpMonth.DataTextField = "Key"
            cardExpMonth.DataValueField = "Value"
            cardExpMonth.DataBind()

            For X As Integer = 2007 To 2024
                Years.Add(X, X)
            Next

            cardExpYear.DataSource = Years
            cardExpYear.DataTextField = "Key"
            cardExpYear.DataValueField = "Value"
            cardExpYear.DataBind()

        End Sub
#End Region

    End Class

End Namespace
