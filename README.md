Notification Bar
===

This widget provides you with a notification bar that can be closed by the user

## Typical usage scenario

Use this widget to notifiy a user of something. This can be a big notification. The user has the ability to close the notification. This will not show up for the user until the text of the widget has changed.

## Compatibility

This widget should be compatible with Mendix 5.18 and higher. The widget was built and tested in Mendix 7.6.

## Contributing
For more information on contributing to this repository visit [Contributing to a GitHub repository](https://docs.mendix.com/howto/collaboration-project-management/contribute-to-a-github-repository)!

## Features

The type of the notification is the same as the [Alert types in Bootstrap](https://getbootstrap.com/docs/3.3/components/#alerts-examples). This can be set in the widget or in attribute. The text that is rendered can be HTML or Markdown.

## Dependencies

This widget packs the following dependencies:

- [local-storage-fallback](https://github.com/ripeworks/local-storage-fallback) (storing the hash of the text in localstorage)
- [md5](https://github.com/pvorb/node-md5) (creating a hash of the text)
- [showdown](https://github.com/showdownjs/showdown) (show markdown instead of HTML)

## Configuration

Configuring the widget should be intuitive. Everything is explained in the configuration screens.

## Troubleshooting

### How do I clear the key, so I see the notification again?

- Open you project in Google Chrome
- Open the Developer Tools (Menu -> More Tools -> Developer Tools)
- Open the tab 'Application'
- On the left, open Storage -> Local Storage -> http://localhost:8000 (assuming you are developing locally. If you do this in the cloud, open that address)
- You should find a couple of key-value pairs in the list. The one you are looking for is ``_closable_notification_XXXX`` (the XXX is the part you set in the Widget -> Storage -> Storage Key)
- Select your key and click on the **X** symbol to delete it. If you refresh the page, it should come back up.

## License

This is licensed under Apache 2.0

