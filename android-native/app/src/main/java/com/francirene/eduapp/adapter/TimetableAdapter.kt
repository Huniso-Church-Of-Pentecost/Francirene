package com.francirene.eduapp.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.francirene.eduapp.databinding.ItemTimetableBinding
import com.francirene.eduapp.model.Timetable

class TimetableAdapter(
    private var items: List<Timetable>,
    private val showDelete: Boolean = false,
    private val onDelete: ((Timetable) -> Unit)? = null
) : RecyclerView.Adapter<TimetableAdapter.VH>() {

    inner class VH(val binding: ItemTimetableBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val binding = ItemTimetableBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(binding)
    }

    override fun getItemCount() = items.size

    override fun onBindViewHolder(holder: VH, position: Int) {
        val t = items[position]
        holder.binding.tvTitle.text = t.title
        holder.binding.tvDates.text = "${t.startDate ?: "?"} → ${t.endDate ?: "?"}"
        holder.binding.tvMeta.text = t.classes ?: ""

        if (showDelete) {
            holder.binding.btnDelete.visibility = android.view.View.VISIBLE
            holder.binding.btnDelete.setOnClickListener { onDelete?.invoke(t) }
        }
    }

    fun update(newItems: List<Timetable>) {
        items = newItems
        notifyDataSetChanged()
    }
}
