import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ActionCard = ({ title, description, icon: Icon, to, color = "indigo" }) => {
    const colorStyles = {
        indigo: {
            hoverBorder: 'group-hover:border-indigo-200',
            iconBg: 'bg-indigo-50 text-indigo-600',
            arrowColor: 'text-indigo-400 group-hover:text-indigo-600'
        },
        emerald: {
            hoverBorder: 'group-hover:border-emerald-200',
            iconBg: 'bg-emerald-50 text-emerald-600',
            arrowColor: 'text-emerald-400 group-hover:text-emerald-600'
        },
        violet: {
            hoverBorder: 'group-hover:border-violet-200',
            iconBg: 'bg-violet-50 text-violet-600',
            arrowColor: 'text-violet-400 group-hover:text-violet-600'
        },
        orange: {
            hoverBorder: 'group-hover:border-orange-200',
            iconBg: 'bg-orange-50 text-orange-600',
            arrowColor: 'text-orange-400 group-hover:text-orange-600'
        }
    };

    const style = colorStyles[color] || colorStyles.indigo;

    return (
        <Link to={to} className="block h-full">
            <motion.div
                whileHover={{ y: -4 }}
                className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 h-full group ${style.hoverBorder}`}
            >
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${style.iconBg} transition-transform group-hover:scale-110 duration-300`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <ArrowRight className={`w-5 h-5 ${style.arrowColor} transition-all duration-300 transform group-hover:translate-x-1`} />
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-slate-800">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    {description}
                </p>
            </motion.div>
        </Link>
    );
};

export default ActionCard;
