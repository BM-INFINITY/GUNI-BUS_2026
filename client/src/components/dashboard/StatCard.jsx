import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = "primary", onClick }) => {
    const colorStyles = {
        primary: {
            bg: 'bg-white',
            iconBg: 'bg-primary-50',
            iconColor: 'text-primary-600',
            border: 'border-slate-200'
        },
        indigo: {
            bg: 'bg-white',
            iconBg: 'bg-indigo-50',
            iconColor: 'text-indigo-600',
            border: 'border-slate-200'
        },
        rose: {
            bg: 'bg-white',
            iconBg: 'bg-rose-50',
            iconColor: 'text-rose-600',
            border: 'border-slate-200'
        },
        amber: {
            bg: 'bg-white',
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-600',
            border: 'border-slate-200'
        }
    };

    const currentStyle = colorStyles[color] || colorStyles.primary;

    return (
        <motion.div
            whileHover={{ y: -4, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onClick={onClick}
            className={`${currentStyle.bg} p-6 rounded-2xl border ${currentStyle.border} shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer relative overflow-hidden group`}
        >
            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-slate-900">{value}</h3>

                    {trend && (
                        <div className={`flex items-center mt-3 text-xs font-medium px-2 py-1 rounded-full w-fit ${trend === 'up' ? 'text-emerald-700 bg-emerald-50' :
                                trend === 'down' ? 'text-rose-700 bg-rose-50' : 'text-slate-600 bg-slate-100'
                            }`}>
                            {trend === 'up' && <ArrowUpRight className="w-3 h-3 mr-1" />}
                            {trend === 'down' && <ArrowDownRight className="w-3 h-3 mr-1" />}
                            {trend === 'neutral' && <Minus className="w-3 h-3 mr-1" />}
                            {trendValue}
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${currentStyle.iconBg} ${currentStyle.iconColor} shadow-inner`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>

            {/* Decorative gradient blob */}
            <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-2xl group-hover:scale-125 transition-transform duration-500
          ${color === 'primary' ? 'bg-primary-500' :
                    color === 'indigo' ? 'bg-indigo-500' :
                        color === 'rose' ? 'bg-rose-500' : 'bg-amber-500'}
      `} />
        </motion.div>
    );
};

export default StatCard;
