// 餐廳休假日管理組件
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';

// 設置moment本地化
moment.locale('zh-tw');
const localizer = momentLocalizer(moment);

interface Holiday {
  id: string;
  restaurant_id: string;
  holiday_date: string;
  holiday_name: string;
  is_recurring: boolean;
  recurring_type?: 'yearly' | 'monthly' | 'weekly';
  description?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Holiday;
}

const RestaurantHolidayManager: React.FC = () => {
  const { restaurantId } = useStore();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newHoliday, setNewHoliday] = useState({
    holiday_name: '',
    description: '',
    is_recurring: false,
    recurring_type: 'yearly' as 'yearly' | 'monthly' | 'weekly'
  });

  // 載入休假日資料
  const loadHolidays = async () => {
    if (!restaurantId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurant_holidays')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('holiday_date');

      if (error) throw error;

      setHolidays(data || []);
      
      // 轉換為日曆事件格式
      const calendarEvents: CalendarEvent[] = (data || []).map(holiday => ({
        id: holiday.id,
        title: `🎄 ${holiday.holiday_name}`,
        start: new Date(holiday.holiday_date),
        end: new Date(holiday.holiday_date),
        resource: holiday
      }));

      setEvents(calendarEvents);
    } catch (error) {
      console.error('載入休假日失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 添加休假日
  const addHoliday = async () => {
    if (!selectedDate || !newHoliday.holiday_name.trim() || !restaurantId) return;

    try {
      const holidayData = {
        restaurant_id: restaurantId,
        holiday_date: selectedDate.toISOString().split('T')[0],
        holiday_name: newHoliday.holiday_name.trim(),
        description: newHoliday.description.trim() || null,
        is_recurring: newHoliday.is_recurring,
        recurring_type: newHoliday.is_recurring ? newHoliday.recurring_type : null
      };

      const { error } = await supabase
        .from('restaurant_holidays')
        .insert([holidayData]);

      if (error) throw error;

      // 重新載入資料
      await loadHolidays();
      
      // 重置表單
      setShowAddModal(false);
      setSelectedDate(null);
      setNewHoliday({
        holiday_name: '',
        description: '',
        is_recurring: false,
        recurring_type: 'yearly'
      });

      alert('休假日已添加成功！');
    } catch (error) {
      console.error('添加休假日失敗:', error);
      alert('添加休假日失敗，請重試');
    }
  };

  // 刪除休假日
  const deleteHoliday = async (holidayId: string) => {
    if (!confirm('確定要刪除這個休假日嗎？')) return;

    try {
      const { error } = await supabase
        .from('restaurant_holidays')
        .delete()
        .eq('id', holidayId);

      if (error) throw error;

      await loadHolidays();
      alert('休假日已刪除');
    } catch (error) {
      console.error('刪除休假日失敗:', error);
      alert('刪除失敗，請重試');
    }
  };

  // 處理日曆點擊
  const handleSelectSlot = ({ start }: { start: Date }) => {
    setSelectedDate(start);
    setShowAddModal(true);
  };

  // 處理事件點擊
  const handleSelectEvent = (event: CalendarEvent) => {
    const holiday = event.resource;
    const action = prompt(`
休假日：${holiday.holiday_name}
日期：${holiday.holiday_date}
描述：${holiday.description || '無'}
週期性：${holiday.is_recurring ? `是 (${holiday.recurring_type})` : '否'}

輸入 'delete' 刪除此休假日，或按取消關閉
    `);

    if (action?.toLowerCase() === 'delete') {
      deleteHoliday(holiday.id);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, [restaurantId]);

  // 自訂日曆樣式
  const eventStyleGetter = () => ({
    style: {
      backgroundColor: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '4px'
    }
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🗓️ 餐廳休假日管理</h2>
        <p className="text-gray-600">
          管理餐廳的休假日期。休假日當天將不開放預約。
          點擊日曆上的日期可添加休假日，點擊現有休假日可進行管理。
        </p>
      </div>

      {/* 營業資訊提示 */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">📋 餐廳營業資訊</h3>
        <div className="text-blue-700 space-y-1">
          <p>🕐 營業時間：每日下午 2:00 - 晚上 9:00</p>
          <p>🍽️ 用餐時長：90 分鐘</p>
          <p>⏰ 最晚預約：晚上 7:30</p>
          <p>🎄 目前共有 {holidays.length} 個休假日</p>
        </div>
      </div>

      {/* 休假日統計 */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h4 className="font-semibold text-red-800">本月休假日</h4>
          <p className="text-2xl font-bold text-red-600">
            {holidays.filter(h => {
              const holidayDate = new Date(h.holiday_date);
              const now = new Date();
              return holidayDate.getMonth() === now.getMonth() && 
                     holidayDate.getFullYear() === now.getFullYear();
            }).length}
          </p>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h4 className="font-semibold text-yellow-800">週期性休假日</h4>
          <p className="text-2xl font-bold text-yellow-600">
            {holidays.filter(h => h.is_recurring).length}
          </p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h4 className="font-semibold text-green-800">一次性休假日</h4>
          <p className="text-2xl font-bold text-green-600">
            {holidays.filter(h => !h.is_recurring).length}
          </p>
        </div>
      </div>

      {/* 日曆 */}
      <div className="h-96 mb-6">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable={true}
          eventPropGetter={eventStyleGetter}
          messages={{
            next: "下一個",
            previous: "上一個", 
            today: "今天",
            month: "月",
            week: "週",
            day: "日",
            agenda: "議程",
            date: "日期",
            time: "時間",
            event: "事件",
            allDay: "全天",
            noEventsInRange: "此時間範圍內沒有休假日"
          }}
        />
      </div>

      {/* 休假日列表 */}
      <div>
        <h3 className="text-lg font-semibold mb-4">📝 休假日列表</h3>
        <div className="space-y-2">
          {holidays.map(holiday => (
            <div key={holiday.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium text-gray-800">{holiday.holiday_name}</span>
                <span className="ml-2 text-gray-600">
                  {new Date(holiday.holiday_date).toLocaleDateString('zh-TW')}
                </span>
                {holiday.is_recurring && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    週期性 ({holiday.recurring_type})
                  </span>
                )}
              </div>
              <button
                onClick={() => deleteHoliday(holiday.id)}
                className="text-red-600 hover:text-red-800 px-3 py-1 rounded transition-colors"
              >
                刪除
              </button>
            </div>
          ))}
          
          {holidays.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              尚未設定任何休假日。點擊日曆上的日期來添加休假日。
            </p>
          )}
        </div>
      </div>

      {/* 添加休假日彈窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              🎄 添加休假日 - {selectedDate?.toLocaleDateString('zh-TW')}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  休假日名稱 *
                </label>
                <input
                  type="text"
                  value={newHoliday.holiday_name}
                  onChange={(e) => setNewHoliday(prev => ({ ...prev, holiday_name: e.target.value }))}
                  placeholder="例：聖誕節、年假、維修日"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述說明
                </label>
                <textarea
                  value={newHoliday.description}
                  onChange={(e) => setNewHoliday(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="休假原因或備註..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newHoliday.is_recurring}
                    onChange={(e) => setNewHoliday(prev => ({ ...prev, is_recurring: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">週期性休假日</span>
                </label>
              </div>
              
              {newHoliday.is_recurring && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    重複週期
                  </label>
                  <select
                    value={newHoliday.recurring_type}
                    onChange={(e) => setNewHoliday(prev => ({ 
                      ...prev, 
                      recurring_type: e.target.value as 'yearly' | 'monthly' | 'weekly'
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="yearly">每年</option>
                    <option value="monthly">每月</option>
                    <option value="weekly">每週</option>
                  </select>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={addHoliday}
                disabled={!newHoliday.holiday_name.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                添加休假日
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantHolidayManager;
