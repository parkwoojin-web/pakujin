# 앱 안의 페이지(file://)는 WebView에서 열고, 외부 링크(https:, mailto: 등)는 기기의 브라우저·앱으로 연다.
.class public Lcom/pakujin/claudeguide/GuideWebViewClient;
.super Landroid/webkit/WebViewClient;

.field private final activity:Landroid/app/Activity;

.method public constructor <init>(Landroid/app/Activity;)V
    .registers 2
    invoke-direct {p0}, Landroid/webkit/WebViewClient;-><init>()V
    iput-object p1, p0, Lcom/pakujin/claudeguide/GuideWebViewClient;->activity:Landroid/app/Activity;
    return-void
.end method

.method public shouldOverrideUrlLoading(Landroid/webkit/WebView;Landroid/webkit/WebResourceRequest;)Z
    .registers 7

    invoke-interface {p2}, Landroid/webkit/WebResourceRequest;->getUrl()Landroid/net/Uri;
    move-result-object v0
    invoke-virtual {v0}, Landroid/net/Uri;->getScheme()Ljava/lang/String;
    move-result-object v1
    const-string v2, "file"
    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v2
    if-eqz v2, :external
    const/4 v2, 0x0
    return v2

    :external
    :try_start
    new-instance v2, Landroid/content/Intent;
    const-string v3, "android.intent.action.VIEW"
    invoke-direct {v2, v3, v0}, Landroid/content/Intent;-><init>(Ljava/lang/String;Landroid/net/Uri;)V
    iget-object v3, p0, Lcom/pakujin/claudeguide/GuideWebViewClient;->activity:Landroid/app/Activity;
    invoke-virtual {v3, v2}, Landroid/app/Activity;->startActivity(Landroid/content/Intent;)V
    :try_end
    .catch Landroid/content/ActivityNotFoundException; {:try_start .. :try_end} :handled

    :handled
    const/4 v2, 0x1
    return v2
.end method
