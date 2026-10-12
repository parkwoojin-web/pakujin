# 웹 화면의 JavaScript에서 window.AndroidPrint.print("작업 이름")으로 부르는 인쇄 창구.
# JavaScript 인터페이스는 백그라운드 스레드에서 불리므로, 실제 인쇄는 화면(UI) 스레드로 넘긴다.
.class public Lcom/pakujin/claudeguide/PrintBridge;
.super Ljava/lang/Object;

.field private final activity:Landroid/app/Activity;
.field private final webView:Landroid/webkit/WebView;

.method public constructor <init>(Landroid/app/Activity;Landroid/webkit/WebView;)V
    .registers 3
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V
    iput-object p1, p0, Lcom/pakujin/claudeguide/PrintBridge;->activity:Landroid/app/Activity;
    iput-object p2, p0, Lcom/pakujin/claudeguide/PrintBridge;->webView:Landroid/webkit/WebView;
    return-void
.end method

.method public print(Ljava/lang/String;)V
    .registers 5
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    new-instance v0, Lcom/pakujin/claudeguide/PrintTask;
    iget-object v1, p0, Lcom/pakujin/claudeguide/PrintBridge;->activity:Landroid/app/Activity;
    iget-object v2, p0, Lcom/pakujin/claudeguide/PrintBridge;->webView:Landroid/webkit/WebView;
    invoke-direct {v0, v1, v2, p1}, Lcom/pakujin/claudeguide/PrintTask;-><init>(Landroid/app/Activity;Landroid/webkit/WebView;Ljava/lang/String;)V
    invoke-virtual {v1, v0}, Landroid/app/Activity;->runOnUiThread(Ljava/lang/Runnable;)V
    return-void
.end method
