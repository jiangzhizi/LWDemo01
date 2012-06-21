﻿(function () {
    "use strict";

    var appViewState = Windows.UI.ViewManagement.ApplicationViewState;
    var nav = WinJS.Navigation;
    var ui = WinJS.UI;
    var utils = WinJS.Utilities;
    var API_DOMAIN = Data.API_DOMAIN;
    var profileInfo;
    var profilePosts;

    var Groups = [
        { key: "profile", title: "profile", subtitle: "profile subtitle title", backgroundImage: darkGray, description: "this is the profile brief wall." }
    ];

    ui.Pages.define("/pages/profile/profile.html", {
        /// <field type="WinJS.Binding.List" />
        items: null,

        // This function updates the ListView with new layouts
        initializeLayout: initializeLayout,

        itemInvoked: itemInvoked ,

        // 每当用户导航至此页面时都要调用此功能。它使用应用程序的数据填充页面元素。
        ready: function (element, options) {

            var pid = options.item && options.item.id;
            getProfile(pid);
            getSomeBodyStream(pid);

            setTimeout(function () {
                var listView = element.querySelector(".itemslist").winControl;
                //var group = (options && options.groupKey) ? Data.resolveGroupReference(options.groupKey) : Data.groups.getAt(0);
                //this.items = Data.getItemsFromGroup(group);
                var pageList = profilePosts.createGrouped(
                    function groupKeySelector(item) { return group.key; },
                    function groupDataSelector(item) { return group; }
                );

                element.querySelector("header[role=banner] .pagetitle").textContent = profileInfo[0].profileName;

                listView.itemDataSource = pageList.dataSource;
                listView.itemTemplate = element.querySelector(".itemtemplate");
                listView.groupDataSource = pageList.groups.dataSource;
                listView.groupHeaderTemplate = element.querySelector(".headerTemplate");
                listView.oniteminvoked = this.itemInvoked.bind(this);

                this.initializeLayout(listView, Windows.UI.ViewManagement.ApplicationView.value);
                listView.element.focus();
            }, 500);
        },

        unload: unload ,

        // 此功能更新页面布局以响应 viewState 更改。
        updateLayout: updateLayout 
    });

    function unload() {
        this.items.dispose();
    }

    function initializeLayout(listView, viewState) {
         /// <param name="listView" value="WinJS.UI.ListView.prototype" />

        if (viewState === appViewState.snapped) {
            listView.layout = new ui.ListLayout();
        } else {
            listView.layout = new ui.GridLayout({ groupHeaderPosition: "left" });
        }
    }

    function itemInvoked(args) {
        var item = this.items.getAt(args.detail.itemIndex);
        nav.navigate("/pages/itemDetail/itemDetail.html", { item: Data.getItemReference(item) });
    }

    function updateLayout(element, viewState, lastViewState) {
        /// <param name="element" domElement="true" />
        /// <param name="viewState" value="Windows.UI.ViewManagement.ApplicationViewState" />
        /// <param name="lastViewState" value="Windows.UI.ViewManagement.ApplicationViewState" />

        var listView = element.querySelector(".itemslist").winControl;
        if (lastViewState !== viewState) {
            if (lastViewState === appViewState.snapped || viewState === appViewState.snapped) {
                var handler = function (e) {
                    listView.removeEventListener("contentanimating", handler, false);
                    e.preventDefault();
                }
                listView.addEventListener("contentanimating", handler, false);
                var firstVisible = listView.indexOfFirstVisible;
                this.initializeLayout(listView, viewState);
                listView.indexOfFirstVisible = firstVisible;
            }
        }
    }

    function getProfile(pId) {
        profileInfo = [];
        //获取某人的个人详细信息         
        $.ajax({
            global: false,
            url: API_DOMAIN + '/user/page/get',
            type: 'GET',
            data: {
                'userId ': pId,
                'access_token': localStorage['access_token']
            },
            _success: function (_data) {
                var obj = {};
                obj.profileName = _data.name;
                obj.profileAvatar = _data.avatarBig;
                obj.profileDescription = _data.brief;
                profileInfo.push(obj);
            }
        });
    }

    //
    function getSomeBodyStream(id) {
        profilePosts = new WinJS.Binding.List();
        var postData = {
            'userId ': (id ? id : ''),
            'cursor': 0,
            'size': 25,
            'access_token': localStorage['access_token']
        };
        $.ajax({
            global: false,
            url: API_DOMAIN + '/feed/post/user/list', 
            type: 'GET',
            data: postData,
            _success: function (data) {
                data = data.values;
                //如果取得的值为空
                if (data.length === 0) {
                    return;
                }
                for (var index in data) {
                    data[index].content = data[index].content.replace(/\n/gi, '<br/>');
                }
                data.forEach(function (item) {//to do rebuild

                    // Each of these sample items should have a reference to a particular group.
                    item.group = Groups[0];
                    item.group.title = item.publisher.name;

                    //item.key = item.id;
                    //item.itemPublisherAvatar = item.publisher.avatar;
                    //item.pname = item.publisher.name;
                    //item.ptime = transformDate(item.createdAt);
                    item.title = transformDate(item.createdAt);
                    item.subtitle = "";
                    item.description = item.content.substr(0, 100);
                    item.content = item.content;
                    item.backgroundImage = (!!(item.attachments[0]) && item.attachments[0].picture) ? item.attachments[0].picture : lightGray;
                    //如果用户没有发图片，就要用内容代替图片
                    item.imageReplacer = (!item.attachments[0] || !item.attachments[0].picture) ? item.description : "";
                    //item.type = 'smallItem';
                    profilePosts.push(item);
                });
            }
        });
    }

})();
