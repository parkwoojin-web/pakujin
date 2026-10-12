// apksig 라이브러리로 APK에 v2 서명을 하고, 서명이 올바른지 바로 검증한다.
// 앱의 최소 지원 버전이 Android 7.0(API 24)이라 v2 서명만으로 충분하다.
// (apksig 2.3.0의 v1 서명은 최신 JDK에서 사라진 내부 API를 써서 동작하지 않는다)
// 사용법: java -cp apksig.jar SignApk.java <입력.apk> <출력.apk> <keystore.p12> <alias>
// 키 저장소 비밀번호는 KEYSTORE_PASSWORD 환경 변수로 받는다.
import com.android.apksig.ApkSigner;
import com.android.apksig.ApkVerifier;
import java.io.File;
import java.io.FileInputStream;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.util.Collections;

public class SignApk {
    public static void main(String[] args) throws Exception {
        if (args.length != 4) {
            System.err.println("사용법: SignApk <입력.apk> <출력.apk> <keystore.p12> <alias>");
            System.exit(2);
        }
        String password = System.getenv("KEYSTORE_PASSWORD");
        if (password == null || password.isEmpty()) {
            System.err.println("KEYSTORE_PASSWORD 환경 변수가 필요합니다");
            System.exit(2);
        }
        char[] pass = password.toCharArray();
        KeyStore keyStore = KeyStore.getInstance("PKCS12");
        try (FileInputStream in = new FileInputStream(args[2])) {
            keyStore.load(in, pass);
        }
        PrivateKey key = (PrivateKey) keyStore.getKey(args[3], pass);
        X509Certificate cert = (X509Certificate) keyStore.getCertificate(args[3]);

        ApkSigner.SignerConfig signerConfig =
                new ApkSigner.SignerConfig.Builder("CERT", key, Collections.singletonList(cert)).build();
        File output = new File(args[1]);
        new ApkSigner.Builder(Collections.singletonList(signerConfig))
                .setInputApk(new File(args[0]))
                .setOutputApk(output)
                .setV1SigningEnabled(false)
                .setV2SigningEnabled(true)
                .build()
                .sign();

        ApkVerifier.Result result = new ApkVerifier.Builder(output).build().verify();
        for (ApkVerifier.IssueWithParams error : result.getErrors()) {
            System.err.println("ERROR: " + error);
        }
        if (!result.isVerified()) {
            System.err.println("서명 검증 실패");
            System.exit(1);
        }
        if (!result.isVerifiedUsingV2Scheme()) {
            System.err.println("v2 서명이 확인되지 않습니다");
            System.exit(1);
        }
        System.out.println("서명 완료 (v2 서명 검증 통과)");
    }
}
