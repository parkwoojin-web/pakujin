# 지금 WebView에 보이는 화면을 기기의 인쇄 화면으로 보낸다. (프린터 또는 PDF로 저장)
.class public Lcom/pakujin/claudeguide/PrintTask;
.super Ljava/lang/Object;
.implements Ljava/lang/Runnable;

.field private final activity:Landroid/app/Activity;
.field private final webView:Landroid/webkit/WebView;
.field private final jobName:Ljava/lang/String;

.method public constructor <init>(Landroid/app/Activity;Landroid/webkit/WebView;Ljava/lang/String;)V
    .registers 4
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V
    iput-object p1, p0, Lcom/pakujin/claudeguide/PrintTask;->activity:Landroid/app/Activity;
    iput-object p2, p0, Lcom/pakujin/claudeguide/PrintTask;->webView:Landroid/webkit/WebView;
    iput-object p3, p0, Lcom/pakujin/claudeguide/PrintTask;->jobName:Ljava/lang/String;
    return-void
.end method

.method public run()V
    .registers 6

    iget-object v0, p0, Lcom/pakujin/claudeguide/PrintTask;->activity:Landroid/app/Activity;
    const-string v1, "print"
    invoke-virtual {v0, v1}, Landroid/app/Activity;->getSystemService(Ljava/lang/String;)Ljava/lang/Object;
    move-result-object v1
    check-cast v1, Landroid/print/PrintManager;
    if-eqz v1, :end

    iget-object v2, p0, Lcom/pakujin/claudeguide/PrintTask;->jobName:Ljava/lang/String;
    iget-object v3, p0, Lcom/pakujin/claudeguide/PrintTask;->webView:Landroid/webkit/WebView;
    invoke-virtual {v3, v2}, Landroid/webkit/WebView;->createPrintDocumentAdapter(Ljava/lang/String;)Landroid/print/PrintDocumentAdapter;
    move-result-object v3
    const/4 v4, 0x0
    invoke-virtual {v1, v2, v3, v4}, Landroid/print/PrintManager;->print(Ljava/lang/String;Landroid/print/PrintDocumentAdapter;Landroid/print/PrintAttributes;)Landroid/print/PrintJob;

    :end
    return-void
.end method
