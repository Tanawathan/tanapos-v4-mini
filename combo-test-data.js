
// 自動生成的套餐測試數據
export const comboTestData = [
  {
    "combo": {
      "id": "3b5857b2-a782-48a0-97d6-95f85f158a4f",
      "restaurant_id": "11111111-1111-1111-1111-111111111111",
      "category_id": null,
      "name": "泰式經典套餐",
      "description": "包含主餐、沙拉和甜點的完整套餐，體驗正宗泰式風味",
      "price": 350,
      "cost": 0,
      "combo_type": "selectable",
      "image_url": null,
      "sort_order": 1,
      "is_available": true,
      "is_active": true,
      "preparation_time": 25,
      "availability_start": null,
      "availability_end": null,
      "available_days": null,
      "min_items": 1,
      "max_items": null,
      "discount_type": "fixed",
      "discount_value": 0,
      "ai_popularity_score": 0.5,
      "ai_recommended": false,
      "created_at": "2025-08-06T05:08:39.711867+00:00",
      "updated_at": "2025-08-06T05:08:39.711867+00:00",
      "metadata": null
    },
    "rules": [
      {
        "id": "94b9cab4-8d24-4f17-87bb-bfc1faec9aea",
        "combo_id": "3b5857b2-a782-48a0-97d6-95f85f158a4f",
        "category_id": null,
        "selection_name": "主餐選擇",
        "description": "請選擇一道主餐",
        "min_selections": 1,
        "max_selections": 1,
        "is_required": true,
        "display_order": 1,
        "created_at": "2025-08-06T05:08:39.956168+00:00",
        "updated_at": "2025-08-06T05:08:39.956168+00:00",
        "combo_selection_options": [
          {
            "id": "4119e543-a3d7-4285-a6d5-775380989ec0",
            "rule_id": "94b9cab4-8d24-4f17-87bb-bfc1faec9aea",
            "products": {
              "id": "95942080-0f97-47ed-807c-9a403d3cfaa2",
              "name": "打拋豬飯",
              "price": 220
            },
            "created_at": "2025-08-06T05:08:40.153282+00:00",
            "is_default": true,
            "product_id": "95942080-0f97-47ed-807c-9a403d3cfaa2",
            "sort_order": 1,
            "additional_price": 0
          },
          {
            "id": "96eb4196-b06f-4c53-a4f5-a52947c5d7a3",
            "rule_id": "94b9cab4-8d24-4f17-87bb-bfc1faec9aea",
            "products": {
              "id": "3b9ca17d-ca62-4327-8eb6-9c2605deba10",
              "name": "雞肉帕泰",
              "price": 190
            },
            "created_at": "2025-08-06T05:08:40.153282+00:00",
            "is_default": false,
            "product_id": "3b9ca17d-ca62-4327-8eb6-9c2605deba10",
            "sort_order": 2,
            "additional_price": -20
          },
          {
            "id": "e7d08f0a-9897-4fea-90d0-f24ef1142877",
            "rule_id": "94b9cab4-8d24-4f17-87bb-bfc1faec9aea",
            "products": {
              "id": "2c5fc386-c13c-4f04-8ef7-010c8173c30e",
              "name": "打拋雞飯",
              "price": 220
            },
            "created_at": "2025-08-06T05:08:40.153282+00:00",
            "is_default": false,
            "product_id": "2c5fc386-c13c-4f04-8ef7-010c8173c30e",
            "sort_order": 3,
            "additional_price": 0
          },
          {
            "id": "feb53adc-197d-483c-86cf-1ab4e159288d",
            "rule_id": "94b9cab4-8d24-4f17-87bb-bfc1faec9aea",
            "products": {
              "id": "1414e7fc-82a6-4175-80ca-f89891bba68a",
              "name": "魚露炸腿飯",
              "price": 250
            },
            "created_at": "2025-08-06T05:08:40.153282+00:00",
            "is_default": false,
            "product_id": "1414e7fc-82a6-4175-80ca-f89891bba68a",
            "sort_order": 4,
            "additional_price": 30
          },
          {
            "id": "25895cca-7540-4c0b-b9a2-678fa206fc90",
            "rule_id": "94b9cab4-8d24-4f17-87bb-bfc1faec9aea",
            "products": {
              "id": "22222222-3333-4444-5555-666666666662",
              "name": "炭烤雞胸",
              "price": 480
            },
            "created_at": "2025-08-06T05:08:40.153282+00:00",
            "is_default": false,
            "product_id": "22222222-3333-4444-5555-666666666662",
            "sort_order": 5,
            "additional_price": 80
          }
        ]
      },
      {
        "id": "7dd0895b-87be-4f76-9341-1e821dfd270c",
        "combo_id": "3b5857b2-a782-48a0-97d6-95f85f158a4f",
        "category_id": null,
        "selection_name": "沙拉選擇",
        "description": "請選擇一道沙拉",
        "min_selections": 1,
        "max_selections": 1,
        "is_required": true,
        "display_order": 2,
        "created_at": "2025-08-06T05:08:39.956168+00:00",
        "updated_at": "2025-08-06T05:08:39.956168+00:00",
        "combo_selection_options": [
          {
            "id": "38369210-cf25-48c6-a5ca-29c5608cb05e",
            "rule_id": "7dd0895b-87be-4f76-9341-1e821dfd270c",
            "products": {
              "id": "75d95537-b6d0-45eb-9e18-e15464b83d7e",
              "name": "涼拌青木瓜",
              "price": 120
            },
            "created_at": "2025-08-06T05:08:40.153282+00:00",
            "is_default": true,
            "product_id": "75d95537-b6d0-45eb-9e18-e15464b83d7e",
            "sort_order": 1,
            "additional_price": 0
          },
          {
            "id": "e78e1d09-f78d-40ae-93d6-1108945c9bbd",
            "rule_id": "7dd0895b-87be-4f76-9341-1e821dfd270c",
            "products": {
              "id": "2ce2edcd-b8ce-4c29-8d22-4acb390ec1f3",
              "name": "Laab 肉末萵苣包",
              "price": 120
            },
            "created_at": "2025-08-06T05:08:40.153282+00:00",
            "is_default": false,
            "product_id": "2ce2edcd-b8ce-4c29-8d22-4acb390ec1f3",
            "sort_order": 2,
            "additional_price": 0
          },
          {
            "id": "179a034c-9dc3-4719-a223-a75be6f3237b",
            "rule_id": "7dd0895b-87be-4f76-9341-1e821dfd270c",
            "products": {
              "id": "22222222-3333-4444-5555-666666666661",
              "name": "凱薩沙拉",
              "price": 280
            },
            "created_at": "2025-08-06T05:08:40.153282+00:00",
            "is_default": false,
            "product_id": "22222222-3333-4444-5555-666666666661",
            "sort_order": 3,
            "additional_price": 50
          }
        ]
      },
      {
        "id": "bd221c44-8705-498f-9b88-5cb2cfdecb6a",
        "combo_id": "3b5857b2-a782-48a0-97d6-95f85f158a4f",
        "category_id": null,
        "selection_name": "甜點選擇",
        "description": "請選擇一道甜點",
        "min_selections": 1,
        "max_selections": 1,
        "is_required": true,
        "display_order": 3,
        "created_at": "2025-08-06T05:08:39.956168+00:00",
        "updated_at": "2025-08-06T05:08:39.956168+00:00",
        "combo_selection_options": [
          {
            "id": "8f7b0585-64ec-4e0d-98fe-782a1fbe95ed",
            "rule_id": "bd221c44-8705-498f-9b88-5cb2cfdecb6a",
            "products": {
              "id": "c0000006-0006-0006-0006-000000000006",
              "name": "提拉米蘇",
              "price": 140
            },
            "created_at": "2025-08-06T05:08:40.153282+00:00",
            "is_default": true,
            "product_id": "c0000006-0006-0006-0006-000000000006",
            "sort_order": 1,
            "additional_price": 0
          },
          {
            "id": "0eafd441-a732-4ed6-9eae-a39370913bb4",
            "rule_id": "bd221c44-8705-498f-9b88-5cb2cfdecb6a",
            "products": {
              "id": "c0000005-0005-0005-0005-000000000005",
              "name": "草莓蛋糕",
              "price": 130
            },
            "created_at": "2025-08-06T05:08:40.153282+00:00",
            "is_default": false,
            "product_id": "c0000005-0005-0005-0005-000000000005",
            "sort_order": 2,
            "additional_price": -10
          }
        ]
      }
    ],
    "priceRange": {
      "min": 320,
      "max": 480
    }
  },
  {
    "combo": {
      "id": "a2cdbe0c-d58c-42d3-ba7a-8e9148d6502f",
      "restaurant_id": "11111111-1111-1111-1111-111111111111",
      "category_id": null,
      "name": "商務午餐套餐",
      "description": "快速便捷的商務午餐選擇，營養均衡",
      "price": 280,
      "cost": 0,
      "combo_type": "selectable",
      "image_url": null,
      "sort_order": 2,
      "is_available": true,
      "is_active": true,
      "preparation_time": 18,
      "availability_start": null,
      "availability_end": null,
      "available_days": null,
      "min_items": 1,
      "max_items": null,
      "discount_type": "fixed",
      "discount_value": 0,
      "ai_popularity_score": 0.5,
      "ai_recommended": false,
      "created_at": "2025-08-06T05:08:39.711867+00:00",
      "updated_at": "2025-08-06T05:08:39.711867+00:00",
      "metadata": null
    },
    "rules": [
      {
        "id": "38db4f21-6069-4c26-ac25-8659e5682ed7",
        "combo_id": "a2cdbe0c-d58c-42d3-ba7a-8e9148d6502f",
        "category_id": null,
        "selection_name": "主餐選擇",
        "description": "請選擇一道主餐",
        "min_selections": 1,
        "max_selections": 1,
        "is_required": true,
        "display_order": 1,
        "created_at": "2025-08-06T05:08:39.956168+00:00",
        "updated_at": "2025-08-06T05:08:39.956168+00:00",
        "combo_selection_options": [
          {
            "id": "7c2c96aa-1896-47be-a9ec-c6c951088001",
            "rule_id": "38db4f21-6069-4c26-ac25-8659e5682ed7",
            "products": {
              "id": "95942080-0f97-47ed-807c-9a403d3cfaa2",
              "name": "打拋豬飯",
              "price": 220
            },
            "created_at": "2025-08-06T05:08:40.153282+00:00",
            "is_default": true,
            "product_id": "95942080-0f97-47ed-807c-9a403d3cfaa2",
            "sort_order": 1,
            "additional_price": 0
          },
          {
            "id": "f0a451bb-0a4f-4682-a30f-06a3b5013c0b",
            "rule_id": "38db4f21-6069-4c26-ac25-8659e5682ed7",
            "products": {
              "id": "3b9ca17d-ca62-4327-8eb6-9c2605deba10",
              "name": "雞肉帕泰",
              "price": 190
            },
            "created_at": "2025-08-06T05:08:40.153282+00:00",
            "is_default": false,
            "product_id": "3b9ca17d-ca62-4327-8eb6-9c2605deba10",
            "sort_order": 2,
            "additional_price": -20
          },
          {
            "id": "e47f2f9c-5d1a-467e-b6fb-a46fe589a152",
            "rule_id": "38db4f21-6069-4c26-ac25-8659e5682ed7",
            "products": {
              "id": "2c5fc386-c13c-4f04-8ef7-010c8173c30e",
              "name": "打拋雞飯",
              "price": 220
            },
            "created_at": "2025-08-06T05:08:40.153282+00:00",
            "is_default": false,
            "product_id": "2c5fc386-c13c-4f04-8ef7-010c8173c30e",
            "sort_order": 3,
            "additional_price": 0
          },
          {
            "id": "97ad1f1a-405b-4e42-9429-d936637a2462",
            "rule_id": "38db4f21-6069-4c26-ac25-8659e5682ed7",
            "products": {
              "id": "1414e7fc-82a6-4175-80ca-f89891bba68a",
              "name": "魚露炸腿飯",
              "price": 250
            },
            "created_at": "2025-08-06T05:08:40.153282+00:00",
            "is_default": false,
            "product_id": "1414e7fc-82a6-4175-80ca-f89891bba68a",
            "sort_order": 4,
            "additional_price": 30
          },
          {
            "id": "de9fd8c6-e171-4222-9b7f-2943151e2e6b",
            "rule_id": "38db4f21-6069-4c26-ac25-8659e5682ed7",
            "products": {
              "id": "22222222-3333-4444-5555-666666666662",
              "name": "炭烤雞胸",
              "price": 480
            },
            "created_at": "2025-08-06T05:08:40.153282+00:00",
            "is_default": false,
            "product_id": "22222222-3333-4444-5555-666666666662",
            "sort_order": 5,
            "additional_price": 80
          }
        ]
      },
      {
        "id": "22e8d4d2-134d-49ef-b317-fc592985411b",
        "combo_id": "a2cdbe0c-d58c-42d3-ba7a-8e9148d6502f",
        "category_id": null,
        "selection_name": "額外配菜",
        "description": "可選擇額外配菜（可選）",
        "min_selections": 0,
        "max_selections": 2,
        "is_required": false,
        "display_order": 2,
        "created_at": "2025-08-06T05:08:39.956168+00:00",
        "updated_at": "2025-08-06T05:08:39.956168+00:00",
        "combo_selection_options": [
          {
            "id": "986c648f-d071-4e24-b1c7-08b47b3c497f",
            "rule_id": "22e8d4d2-134d-49ef-b317-fc592985411b",
            "products": {
              "id": "75d95537-b6d0-45eb-9e18-e15464b83d7e",
              "name": "涼拌青木瓜",
              "price": 120
            },
            "created_at": "2025-08-06T05:08:40.153282+00:00",
            "is_default": false,
            "product_id": "75d95537-b6d0-45eb-9e18-e15464b83d7e",
            "sort_order": 1,
            "additional_price": 60
          },
          {
            "id": "38aa4060-1897-4e37-8b8f-51fc72bb86b7",
            "rule_id": "22e8d4d2-134d-49ef-b317-fc592985411b",
            "products": {
              "id": "2ce2edcd-b8ce-4c29-8d22-4acb390ec1f3",
              "name": "Laab 肉末萵苣包",
              "price": 120
            },
            "created_at": "2025-08-06T05:08:40.153282+00:00",
            "is_default": false,
            "product_id": "2ce2edcd-b8ce-4c29-8d22-4acb390ec1f3",
            "sort_order": 2,
            "additional_price": 60
          }
        ]
      }
    ],
    "priceRange": {
      "min": 260,
      "max": 360
    }
  },
  {
    "combo": {
      "id": "6fabe20e-2ef3-4273-9f8e-07030b43b3c9",
      "restaurant_id": "11111111-1111-1111-1111-111111111111",
      "category_id": null,
      "name": "家庭分享套餐",
      "description": "適合2-3人分享的豪華套餐組合",
      "price": 650,
      "cost": 0,
      "combo_type": "selectable",
      "image_url": null,
      "sort_order": 3,
      "is_available": true,
      "is_active": true,
      "preparation_time": 35,
      "availability_start": null,
      "availability_end": null,
      "available_days": null,
      "min_items": 1,
      "max_items": null,
      "discount_type": "fixed",
      "discount_value": 0,
      "ai_popularity_score": 0.5,
      "ai_recommended": false,
      "created_at": "2025-08-06T05:08:39.711867+00:00",
      "updated_at": "2025-08-06T05:08:39.711867+00:00",
      "metadata": null
    },
    "rules": [
      {
        "id": "3a791595-63c3-481e-85df-f1fc8484704c",
        "combo_id": "6fabe20e-2ef3-4273-9f8e-07030b43b3c9",
        "category_id": null,
        "selection_name": "主餐選擇",
        "description": "請選擇2-3道主餐",
        "min_selections": 2,
        "max_selections": 3,
        "is_required": true,
        "display_order": 1,
        "created_at": "2025-08-06T05:08:39.956168+00:00",
        "updated_at": "2025-08-06T05:08:39.956168+00:00",
        "combo_selection_options": [
          {
            "id": "b0a9342a-4770-4a21-bebb-0c473e8395a6",
            "rule_id": "3a791595-63c3-481e-85df-f1fc8484704c",
            "products": {
              "id": "95942080-0f97-47ed-807c-9a403d3cfaa2",
              "name": "打拋豬飯",
              "price": 220
            },
            "created_at": "2025-08-06T05:08:40.153282+00:00",
            "is_default": true,
            "product_id": "95942080-0f97-47ed-807c-9a403d3cfaa2",
            "sort_order": 1,
            "additional_price": 0
          },
          {
            "id": "810a85d9-c174-4d3b-b839-88da89688104",
            "rule_id": "3a791595-63c3-481e-85df-f1fc8484704c",
            "products": {
              "id": "3b9ca17d-ca62-4327-8eb6-9c2605deba10",
              "name": "雞肉帕泰",
              "price": 190
            },
            "created_at": "2025-08-06T05:08:40.153282+00:00",
            "is_default": false,
            "product_id": "3b9ca17d-ca62-4327-8eb6-9c2605deba10",
            "sort_order": 2,
            "additional_price": -20
          },
          {
            "id": "2c3b3f44-132f-46bc-9f1e-a9c7d9dcda7f",
            "rule_id": "3a791595-63c3-481e-85df-f1fc8484704c",
            "products": {
              "id": "2c5fc386-c13c-4f04-8ef7-010c8173c30e",
              "name": "打拋雞飯",
              "price": 220
            },
            "created_at": "2025-08-06T05:08:40.153282+00:00",
            "is_default": false,
            "product_id": "2c5fc386-c13c-4f04-8ef7-010c8173c30e",
            "sort_order": 3,
            "additional_price": 0
          },
          {
            "id": "dfddfac6-4db4-451e-97fd-af52b2458c12",
            "rule_id": "3a791595-63c3-481e-85df-f1fc8484704c",
            "products": {
              "id": "1414e7fc-82a6-4175-80ca-f89891bba68a",
              "name": "魚露炸腿飯",
              "price": 250
            },
            "created_at": "2025-08-06T05:08:40.153282+00:00",
            "is_default": false,
            "product_id": "1414e7fc-82a6-4175-80ca-f89891bba68a",
            "sort_order": 4,
            "additional_price": 30
          },
          {
            "id": "bef6d0a0-5705-4be7-a684-59ad590d08c4",
            "rule_id": "3a791595-63c3-481e-85df-f1fc8484704c",
            "products": {
              "id": "22222222-3333-4444-5555-666666666662",
              "name": "炭烤雞胸",
              "price": 480
            },
            "created_at": "2025-08-06T05:08:40.153282+00:00",
            "is_default": false,
            "product_id": "22222222-3333-4444-5555-666666666662",
            "sort_order": 5,
            "additional_price": 80
          }
        ]
      },
      {
        "id": "91e174bc-a814-44d3-ba4e-c793183478cd",
        "combo_id": "6fabe20e-2ef3-4273-9f8e-07030b43b3c9",
        "category_id": null,
        "selection_name": "配菜選擇",
        "description": "請選擇配菜",
        "min_selections": 1,
        "max_selections": 3,
        "is_required": true,
        "display_order": 2,
        "created_at": "2025-08-06T05:08:39.956168+00:00",
        "updated_at": "2025-08-06T05:08:39.956168+00:00",
        "combo_selection_options": [
          {
            "id": "156c98e1-49ab-45d2-b1cb-d435c9f4b7bc",
            "rule_id": "91e174bc-a814-44d3-ba4e-c793183478cd",
            "products": {
              "id": "75d95537-b6d0-45eb-9e18-e15464b83d7e",
              "name": "涼拌青木瓜",
              "price": 120
            },
            "created_at": "2025-08-06T05:08:40.153282+00:00",
            "is_default": true,
            "product_id": "75d95537-b6d0-45eb-9e18-e15464b83d7e",
            "sort_order": 1,
            "additional_price": 0
          },
          {
            "id": "fa0ec168-bf5c-4cee-92db-7247547de043",
            "rule_id": "91e174bc-a814-44d3-ba4e-c793183478cd",
            "products": {
              "id": "2ce2edcd-b8ce-4c29-8d22-4acb390ec1f3",
              "name": "Laab 肉末萵苣包",
              "price": 120
            },
            "created_at": "2025-08-06T05:08:40.153282+00:00",
            "is_default": false,
            "product_id": "2ce2edcd-b8ce-4c29-8d22-4acb390ec1f3",
            "sort_order": 2,
            "additional_price": 0
          },
          {
            "id": "a8fc8f7e-0684-4dcf-b7fd-d75a9c6b400c",
            "rule_id": "91e174bc-a814-44d3-ba4e-c793183478cd",
            "products": {
              "id": "22222222-3333-4444-5555-666666666661",
              "name": "凱薩沙拉",
              "price": 280
            },
            "created_at": "2025-08-06T05:08:40.153282+00:00",
            "is_default": false,
            "product_id": "22222222-3333-4444-5555-666666666661",
            "sort_order": 3,
            "additional_price": 50
          }
        ]
      },
      {
        "id": "cdc12817-006c-492a-8b24-1f53f6d91690",
        "combo_id": "6fabe20e-2ef3-4273-9f8e-07030b43b3c9",
        "category_id": null,
        "selection_name": "甜點選擇",
        "description": "請選擇甜點",
        "min_selections": 1,
        "max_selections": 2,
        "is_required": false,
        "display_order": 3,
        "created_at": "2025-08-06T05:08:39.956168+00:00",
        "updated_at": "2025-08-06T05:08:39.956168+00:00",
        "combo_selection_options": [
          {
            "id": "40e519c8-96ad-4e40-90e7-96d2bd2c844b",
            "rule_id": "cdc12817-006c-492a-8b24-1f53f6d91690",
            "products": {
              "id": "c0000006-0006-0006-0006-000000000006",
              "name": "提拉米蘇",
              "price": 140
            },
            "created_at": "2025-08-06T05:08:40.153282+00:00",
            "is_default": true,
            "product_id": "c0000006-0006-0006-0006-000000000006",
            "sort_order": 1,
            "additional_price": 0
          },
          {
            "id": "f48e7fc3-485a-4df2-b54d-7d5c21ec58bc",
            "rule_id": "cdc12817-006c-492a-8b24-1f53f6d91690",
            "products": {
              "id": "c0000005-0005-0005-0005-000000000005",
              "name": "草莓蛋糕",
              "price": 130
            },
            "created_at": "2025-08-06T05:08:40.153282+00:00",
            "is_default": false,
            "product_id": "c0000005-0005-0005-0005-000000000005",
            "sort_order": 2,
            "additional_price": -10
          }
        ]
      }
    ],
    "priceRange": {
      "min": 610,
      "max": 1040
    }
  }
];

// 快速測試函數
export function getComboById(id) {
  return comboTestData.find(item => item.combo.id === id);
}

export function getComboByName(name) {
  return comboTestData.find(item => item.combo.name === name);
}

export function getAllCombos() {
  return comboTestData.map(item => item.combo);
}

export function getAllRulesForCombo(comboId) {
  const item = getComboById(comboId);
  return item ? item.rules : [];
}

// 價格計算函數
export function calculateComboPrice(comboId, selections) {
  const item = getComboById(comboId);
  if (!item) return 0;
  
  let totalPrice = item.combo.price;
  
  item.rules.forEach(rule => {
    const ruleSelections = selections[rule.id] || [];
    ruleSelections.forEach(optionId => {
      const option = rule.combo_selection_options.find(opt => opt.id === optionId);
      if (option) {
        totalPrice += option.additional_price;
      }
    });
  });
  
  return totalPrice;
}

console.log('套餐測試數據已載入:', comboTestData.length, '個套餐');
    