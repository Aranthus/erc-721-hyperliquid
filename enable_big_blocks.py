import argparse
from dotenv import load_dotenv
import eth_account
import os
import requests

from hyperliquid.utils.signing import (
    get_timestamp_ms,
    sign_l1_action,
)

# .env.nft dosyasını yükle
load_dotenv(dotenv_path='.env.nft')

def main(using_big_blocks):
    # .env.nft'den özel anahtarı al (0x olmadan)
    private_key = os.getenv("PRIVATE_KEY")
    if not private_key:
        raise ValueError("PRIVATE_KEY bulunamadı, lütfen .env.nft dosyasını kontrol edin.")
    
    print(f"Özel anahtar kullanılıyor: {private_key[:4]}...{private_key[-4:]}")
    
    # Wallet oluştur
    wallet = eth_account.Account.from_key(private_key)
    print(f"Cüzdan adresi: {wallet.address}")

    # Zaman damgası oluştur
    timestamp = get_timestamp_ms()
    print(f"Zaman damgası: {timestamp}")

    # L1 eylemi hazırla
    action = {
        "type": "evmUserModify",
        "usingBigBlocks": using_big_blocks
    }
    print(f"Ayarlanacak değer: usingBigBlocks={using_big_blocks}")

    # Eylemi imzala (True=Mainnet için, False=Testnet için)
    # RPC_URL içinde 'testnet' geçiyor mu kontrol et
    rpc_url = os.getenv("RPC_URL", "").lower()
    is_mainnet = "testnet" not in rpc_url
    
    print(f"Ağ: {'MAINNET' if is_mainnet else 'TESTNET'}")
    
    signature = sign_l1_action(
        wallet,
        action,
        None,
        timestamp,
        is_mainnet,  # True=Mainnet, False=Testnet
    )

    # İstek payload'ını hazırla
    payload = {
        "action": action,
        "nonce": timestamp,
        "signature": signature
    }
    print(f"Gönderilecek veri: {payload}")

    # API URL'ini belirle
    api_url = "https://api.hyperliquid.xyz/exchange" if is_mainnet else "https://api.hyperliquid-testnet.xyz/exchange"
    print(f"API URL: {api_url}")

    # POST isteği gönder
    print(f"İstek gönderiliyor...")
    response = requests.post(
        api_url,
        headers={"Content-Type": "application/json"},
        json=payload
    )

    # Yanıtı yazdır
    print(f"Durum Kodu: {response.status_code}")
    try:
        print(f"Yanıt: {response.json()}")
        
        if response.status_code == 200 and response.json().get('status') == 'ok':
            state_text = "ETKİNLEŞTİRİLDİ" if using_big_blocks else "DEVRE DIŞI BIRAKILDI"
            print(f"\n✅ Big Blocks modu başarıyla {state_text}!")
            print(f"   Artık büyük kontratları {'deploy edebilirsiniz' if using_big_blocks else 'deploy etmek için Big Blocks modunu tekrar etkinleştirmeniz gerekecek'}.")
        else:
            print(f"\n❌ Big Blocks modunu değiştirme işlemi başarısız oldu!")
            print(f"   Hata detayları: {response.json()}")
    except ValueError:
        print(f"API yanıtı JSON formatında değil: {response.text}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Big Blocks modunu etkinleştirme veya devre dışı bırakma scripti.")
    parser.add_argument("usingBigBlocks", type=str, choices=["true", "false"], help="Big Blocks modu için boolean değeri (true/false)")
    args = parser.parse_args()

    # String argümanı boolean'a çevir
    using_big_blocks = args.usingBigBlocks.lower() == "true"

    main(using_big_blocks)
