import React from 'react';

export function TabWidget({ tabs, activeTab, onTabChange, renderLayoutItem }: { tabs: any[], activeTab: string, onTabChange: (tabId: string) => void, renderLayoutItem: (item: any) => React.ReactNode }) {

  const activeTabContent = tabs.find((tab: any) => tab.id === activeTab)?.children;

  return (
    <div>
      <div role="tablist" className="tabs tabs-lift tabs-xs">
        {tabs.map((tab: any) => (
          <a
            key={tab.id}
            className={`tab tab-lifted ${activeTab === tab.id ? 'tab-active' : ''}`}
            onClick={(e) => { e.preventDefault(); onTabChange(tab.id); }}
          >
            {tab.label}
          </a>
        ))}
      </div>
      <div className="p-4">
        {activeTabContent && activeTabContent.map((item: any, index: number) => React.cloneElement(renderLayoutItem(item), { key: `${activeTab}-${index}` }))}
      </div>
    </div>
  );
}
