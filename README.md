# Send to GPTs

Webページで選択したテキストを、右クリックメニューから指定したChatGPTのGPTへ自動送信するChrome拡張機能です。

## 機能

- 選択テキストを右クリックからGPTへ送信
- 複数のGPTを登録し、サブメニューから送信先を選択
- GPTの共有URLまたは `g-` から始まるIDで登録
- ChatGPTの入力欄が表示されるまで待機し、自動入力・送信
- 設定をChrome同期ストレージに保存

## インストール

1. このリポジトリをクローンまたはダウンロードします。
   ```bash
   git clone https://github.com/tag0203/send-to-gpts.git
   ```
2. Chromeで `chrome://extensions/` を開きます。
3. 「デベロッパーモード」をオンにします。
4. 「パッケージ化されていない拡張機能を読み込む」を選び、このフォルダを指定します。

## 設定

1. Chromeの拡張機能一覧で「Send to GPTs」の「詳細」→「拡張機能のオプション」を開きます。
2. ChatGPTで送信先のGPTを開き、URLをコピーします。
   ```text
   https://chatgpt.com/g/g-xxxxxxxx-example
   ```
3. 表示名とURL（または `g-xxxxxxxx` 形式のID）を入力して「追加」します。
4. 「保存」を押します。

## 使い方

1. 任意のWebページで文章を選択します。
2. 右クリックして「GPTsへ送る」から送信先を選びます。
3. 新しいタブで対象のGPTが開き、選択文が自動送信されます。

GPTが1件だけの場合、右クリックメニューには「（GPT名）へ送る」と直接表示されます。未登録の場合は設定画面を開く項目が表示されます。

## ファイル構成

```text
manifest.json   拡張機能の定義
background.js   右クリックメニュー、タブ、未送信データの管理
content.js      ChatGPTへの入力と送信
options.html    設定画面
options.css     設定画面のスタイル
options.js      GPT登録・保存処理
```

## 権限

| 権限 | 用途 |
|---|---|
| `contextMenus` | 選択テキスト用の右クリックメニュー |
| `storage` | GPT設定とタブ単位の未送信データの保存 |
| `tabs` | 対象GPTを新しいタブで開く |
| `https://chatgpt.com/*` | ChatGPT上でテキストを入力・送信 |

## 注意事項

- ChatGPTにログインしている必要があります。
- GPTの利用権限がない場合、そのGPTへは送信できません。
- ChatGPTの画面構造が変更された場合、自動入力・送信処理の更新が必要になることがあります。
- 選択した文章は、登録したGPTに自動送信されます。機密情報を送らないよう注意してください。

## ライセンス

MIT
