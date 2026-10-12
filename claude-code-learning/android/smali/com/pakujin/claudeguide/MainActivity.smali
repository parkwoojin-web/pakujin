# 앱 화면 전체를 WebView 하나로 채우고, assets/index.html(빌드된 가이드)을 연다.
.class public Lcom/pakujin/claudeguide/MainActivity;
.super Landroid/app/Activity;

.field private webView:Landroid/webkit/WebView;

.method public constructor <init>()V
    .registers 1
    invoke-direct {p0}, Landroid/app/Activity;-><init>()V
    return-void
.end method

.method protected onCreate(Landroid/os/Bundle;)V
    .registers 6

    invoke-super {p0, p1}, Landroid/app/Activity;->onCreate(Landroid/os/Bundle;)V

    new-instance v0, Landroid/webkit/WebView;
    invoke-direct {v0, p0}, Landroid/webkit/WebView;-><init>(Landroid/content/Context;)V
    iput-object v0, p0, Lcom/pakujin/claudeguide/MainActivity;->webView:Landroid/webkit/WebView;

    # 화면 동작(JavaScript)과 진도 저장(localStorage)을 켠다
    invoke-virtual {v0}, Landroid/webkit/WebView;->getSettings()Landroid/webkit/WebSettings;
    move-result-object v1
    const/4 v2, 0x1
    invoke-virtual {v1, v2}, Landroid/webkit/WebSettings;->setJavaScriptEnabled(Z)V
    invoke-virtual {v1, v2}, Landroid/webkit/WebSettings;->setDomStorageEnabled(Z)V

    new-instance v1, Lcom/pakujin/claudeguide/GuideWebViewClient;
    invoke-direct {v1, p0}, Lcom/pakujin/claudeguide/GuideWebViewClient;-><init>(Landroid/app/Activity;)V
    invoke-virtual {v0, v1}, Landroid/webkit/WebView;->setWebViewClient(Landroid/webkit/WebViewClient;)V

    # 웹 화면의 인쇄 버튼이 기기의 인쇄 기능을 쓸 수 있게 연결한다 (window.AndroidPrint)
    new-instance v1, Lcom/pakujin/claudeguide/PrintBridge;
    invoke-direct {v1, p0, v0}, Lcom/pakujin/claudeguide/PrintBridge;-><init>(Landroid/app/Activity;Landroid/webkit/WebView;)V
    const-string v2, "AndroidPrint"
    invoke-virtual {v0, v1, v2}, Landroid/webkit/WebView;->addJavascriptInterface(Ljava/lang/Object;Ljava/lang/String;)V

    invoke-virtual {p0, v0}, Lcom/pakujin/claudeguide/MainActivity;->setContentView(Landroid/view/View;)V

    # 화면 회전 등으로 다시 만들어질 때는 보던 페이지를 복원한다
    if-eqz p1, :load_home
    invoke-virtual {v0, p1}, Landroid/webkit/WebView;->restoreState(Landroid/os/Bundle;)Landroid/webkit/WebBackForwardList;
    move-result-object v1
    if-nez v1, :done

    :load_home
    const-string v1, "file:///android_asset/index.html"
    invoke-virtual {v0, v1}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V

    :done
    return-void
.end method

.method protected onSaveInstanceState(Landroid/os/Bundle;)V
    .registers 3
    invoke-super {p0, p1}, Landroid/app/Activity;->onSaveInstanceState(Landroid/os/Bundle;)V
    iget-object v0, p0, Lcom/pakujin/claudeguide/MainActivity;->webView:Landroid/webkit/WebView;
    if-eqz v0, :end
    invoke-virtual {v0, p1}, Landroid/webkit/WebView;->saveState(Landroid/os/Bundle;)Landroid/webkit/WebBackForwardList;
    :end
    return-void
.end method

# 뒤로 가기 버튼: 앱 안에서 이전 화면이 있으면 그 화면으로, 없으면 앱 종료
.method public onBackPressed()V
    .registers 3
    iget-object v0, p0, Lcom/pakujin/claudeguide/MainActivity;->webView:Landroid/webkit/WebView;
    if-eqz v0, :exit
    invoke-virtual {v0}, Landroid/webkit/WebView;->canGoBack()Z
    move-result v1
    if-eqz v1, :exit
    invoke-virtual {v0}, Landroid/webkit/WebView;->goBack()V
    return-void

    :exit
    invoke-super {p0}, Landroid/app/Activity;->onBackPressed()V
    return-void
.end method
